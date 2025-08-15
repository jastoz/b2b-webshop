import fs from 'fs';

const users = JSON.parse(fs.readFileSync('data/test-customer-users.json', 'utf8'));
console.log('Total users:', users.data.length);

const emails = users.data.map(u => u.email);
const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
console.log('Duplicate emails:', [...new Set(duplicates)]);
console.log('Count of duplicates:', duplicates.length);

// Show some example duplicates
const emailCount = {};
emails.forEach(email => {
  emailCount[email] = (emailCount[email] || 0) + 1;
});

const duplicateEntries = Object.entries(emailCount).filter(([email, count]) => count > 1);
console.log('\nDuplicate details:');
duplicateEntries.forEach(([email, count]) => {
  console.log(`  ${email}: ${count} times`);
});