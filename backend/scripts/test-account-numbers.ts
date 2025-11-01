import { DatabaseService } from '../src/services/database.service';

// Test the new account number generation
function testAccountNumberGeneration() {
  console.log('🧪 Testing new account number generation...\n');

  const testCount = 10;
  const generatedNumbers: string[] = [];

  for (let i = 0; i < testCount; i++) {
    const accountNumber = DatabaseService.generateAccountNumber();
    generatedNumbers.push(accountNumber);

    console.log(`Test ${i + 1}: ${accountNumber}`);
    
    // Validate the generated number
    const isValid = validateAccountNumber(accountNumber);
    console.log(`  ✅ Valid: ${isValid}`);
    console.log(`  📏 Length: ${accountNumber.length}`);
    console.log(`  🔢 Numeric only: ${/^\d+$/.test(accountNumber)}`);
    console.log('');
  }

  // Check for duplicates
  const uniqueNumbers = new Set(generatedNumbers);
  const hasDuplicates = uniqueNumbers.size !== generatedNumbers.length;
  
  console.log('📊 Summary:');
  console.log(`  Total generated: ${generatedNumbers.length}`);
  console.log(`  Unique numbers: ${uniqueNumbers.size}`);
  console.log(`  Has duplicates: ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
  
  if (hasDuplicates) {
    console.log('⚠️  Warning: Duplicate account numbers detected!');
  } else {
    console.log('🎉 All account numbers are unique!');
  }
}

function validateAccountNumber(accountNumber: string): boolean {
  // Check if it's exactly 12 digits and numeric only
  return accountNumber.length === 12 && /^\d+$/.test(accountNumber);
}

// Run the test
testAccountNumberGeneration();
