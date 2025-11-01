import { DatabaseService } from '../src/services/database.service';

// Test the new account name formatting
function testAccountNameFormatting() {
  console.log('🧪 Testing account name formatting...\n');

  const testCases = [
    { firstName: 'Nguyễn', lastName: 'Thành Lộc', expected: 'NGUYEN THANH LOC' },
    { firstName: 'Trần', lastName: 'Văn Đức', expected: 'TRAN VAN DUC' },
    { firstName: 'Lê', lastName: 'Thị Hương', expected: 'LE THI HUONG' },
    { firstName: 'Phạm', lastName: 'Minh Tuấn', expected: 'PHAM MINH TUAN' },
    { firstName: 'Hoàng', lastName: 'Thị Mai', expected: 'HOANG THI MAI' },
    { firstName: 'John', lastName: 'Doe', expected: 'JOHN DOE' },
    { firstName: 'Mary', lastName: 'Jane Smith', expected: 'MARY JANE SMITH' },
    { firstName: 'Nguyễn', lastName: 'Đức Minh', expected: 'NGUYEN DUC MINH' },
    { firstName: 'Trần', lastName: 'Thị Ánh', expected: 'TRAN THI ANH' },
    { firstName: 'Lê', lastName: 'Văn Hùng', expected: 'LE VAN HUNG' },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    const result = DatabaseService.formatUserName(testCase.firstName, testCase.lastName);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.firstName} ${testCase.lastName}`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
    console.log(`  Result:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    if (passed) passedTests++;
  });

  console.log('📊 Summary:');
  console.log(`  Total tests: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${totalTests - passedTests}`);
  console.log(`  Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the test
testAccountNameFormatting();
