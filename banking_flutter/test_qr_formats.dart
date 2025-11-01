// Test QR Code formats
void testQRFormats() {
  // Test cases for different QR formats
  final testCases = [
    // Our custom format
    '{"type":"banking_transfer","accountNumber":"1234567890","accountName":"NGUYEN VAN A","bankName":"Chidi Bank","timestamp":1234567890}',

    // VietQR format
    'https://vietqr.net/transfer/970415/1234567890',

    // EMV QR format (simplified)
    '00020101021238570010A00000072701270006970415012345678905204000053037045802VN5910MERCHANT NAME6007HO CHI MINH6105840000620400006304',

    // Plain account number
    '1234567890',

    // Invalid format
    'invalid_qr_data',
  ];

  for (final testCase in testCases) {
    print('Testing: $testCase');
    // Test parsing logic here
  }
}
