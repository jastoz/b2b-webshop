"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

export function ShadcnDemo() {
  const [inputValue, setInputValue] = useState("")
  const [selectValue, setSelectValue] = useState("")
  const [comboboxValue, setComboboxValue] = useState("")
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: "Success!",
      description: "shadcn/ui components are working perfectly with your blue primary theme.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">shadcn/ui Components Demo</h1>
        <p className="text-gray-600">Your components are now styled with your custom blue primary color</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={showToast} className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">Secondary</Button>
            <Button variant="outline" className="w-full">Outline</Button>
            <Button variant="ghost" className="w-full">Ghost</Button>
            <Button variant="destructive" className="w-full">Destructive</Button>
          </CardContent>
        </Card>

        {/* Form Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Form Controls</CardTitle>
            <CardDescription>Input and select components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Type something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="next">Next.js</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="vue">Vue</SelectItem>
                <SelectItem value="svelte">Svelte</SelectItem>
              </SelectContent>
            </Select>
            <Combobox
              options={frameworks}
              value={comboboxValue}
              onValueChange={setComboboxValue}
              placeholder="Search framework..."
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Badges and Sheet */}
        <Card>
          <CardHeader>
            <CardTitle>Badges & Sheet</CardTitle>
            <CardDescription>Status indicators and slide-out panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Example</SheetTitle>
                  <SheetDescription>
                    This is a slide-out sheet component. Perfect for forms, settings, or additional content.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-600">
                    Your sheet content goes here. The component uses your custom blue primary color theme.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>

      {/* Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓</Badge>
              <span className="text-sm">shadcn/ui Installed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓</Badge>
              <span className="text-sm">Custom Colors Preserved</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓</Badge>
              <span className="text-sm">Inter Font Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓</Badge>
              <span className="text-sm">Tailwind Integration</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Success!</strong> All components are using your custom blue primary color (#3b82f6) and Inter font family.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}