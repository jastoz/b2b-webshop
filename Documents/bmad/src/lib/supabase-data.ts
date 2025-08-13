import { supabase, type Customer, type CustomerProduct } from './supabase';
import type { ApiResponse } from '@/types';

// Customer data access functions
export const getCustomers = async (): Promise<ApiResponse<Customer[]>> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch customers',
      data: []
    };
  }
};

export const getCustomer = async (customerId: string): Promise<ApiResponse<Customer | null>> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch customer',
      data: null
    };
  }
};

// Product data access functions
export const getCustomerProducts = async (
  customerId: string
): Promise<ApiResponse<CustomerProduct[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_products', {
        customer_id_param: customerId
      });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch customer products',
      data: []
    };
  }
};

export const searchCustomerProducts = async (
  customerId: string,
  searchTerm: string = '',
  categoryFilter: string = '',
  limit: number = 50
): Promise<ApiResponse<CustomerProduct[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('search_customer_products', {
        customer_id_param: customerId,
        search_term: searchTerm,
        category_filter: categoryFilter,
        limit_count: limit
      });

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    // Transform to match the expected CustomerProduct interface
    const transformedData = (data || []).map(item => ({
      ...item,
      contract_id: item.contract_id || 0,
      discount: item.discount || 0,
      is_active: true // search only returns active products
    }));

    return {
      success: true,
      data: transformedData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to search customer products',
      data: []
    };
  }
};

// Category functions
export const getCategories = async (): Promise<ApiResponse<string[]>> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name');

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    const categories = data?.map(item => item.name) || [];

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch categories',
      data: []
    };
  }
};

export const getCustomerCategories = async (customerId: string): Promise<ApiResponse<string[]>> => {
  try {
    const { data, error } = await supabase
      .from('customer_products')
      .select(`
        products!inner(
          categories!inner(name)
        )
      `)
      .eq('customer_id', customerId)
      .eq('is_active', true);

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    // Extract unique category names
    const categories = new Set<string>();
    data?.forEach((item: any) => {
      if (item.products?.categories?.name) {
        categories.add(item.products.categories.name);
      }
    });

    return {
      success: true,
      data: Array.from(categories).sort()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch customer categories',
      data: []
    };
  }
};

// Cart persistence functions
export const saveCartToSupabase = async (
  customerId: string,
  cartItems: any[]
): Promise<ApiResponse<string>> => {
  try {
    // Calculate totals
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cartItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

    // Create or update order in draft status
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'draft')
      .single();

    let orderId: string;

    if (existingOrder) {
      // Update existing draft order
      const { data, error } = await supabase
        .from('orders')
        .update({
          total_value: totalValue,
          total_items: totalItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id)
        .select('id')
        .single();

      if (error) throw error;
      orderId = data.id;

      // Delete existing order items
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
    } else {
      // Create new draft order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          status: 'draft',
          total_value: totalValue,
          total_items: totalItems
        })
        .select('id')
        .single();

      if (error) throw error;
      orderId = data.id;
    }

    // Insert order items
    if (cartItems.length > 0) {
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_code: item.productCode,
        product_name: item.productName || 'Unknown Product',
        unit: item.unit || 'KOM',
        quantity: item.quantity,
        price_per_unit: item.pricePerUnit
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    return {
      success: true,
      data: orderId
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save cart to database',
      data: ''
    };
  }
};

export const loadCartFromSupabase = async (customerId: string): Promise<ApiResponse<any[]>> => {
  try {
    // Find draft order for customer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          product_code,
          product_name,
          unit,
          quantity,
          price_per_unit
        )
      `)
      .eq('customer_id', customerId)
      .eq('status', 'draft')
      .single();

    if (orderError || !order) {
      return {
        success: true,
        data: [] // Return empty cart if no draft order exists
      };
    }

    // Transform order items to cart format
    const cartItems = order.order_items.map((item: any) => ({
      productCode: item.product_code,
      productName: item.product_name,
      unit: item.unit,
      quantity: item.quantity,
      pricePerUnit: item.price_per_unit,
      totalPrice: item.quantity * item.price_per_unit
    }));

    return {
      success: true,
      data: cartItems
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to load cart from database',
      data: []
    };
  }
};

// Real-time subscriptions
export const subscribeToCustomerProducts = (
  customerId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`customer_products_${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customer_products',
        filter: `customer_id=eq.${customerId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToCart = (
  customerId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`orders_${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`
      },
      callback
    )
    .subscribe();
};