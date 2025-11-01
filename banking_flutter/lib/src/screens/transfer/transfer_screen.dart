import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ionicons/ionicons.dart';
import '../../services/banking_service.dart';
import '../../services/http_client.dart';
import '../../services/auth_service.dart';
import '../../services/security_service.dart';
import '../../models/account.dart';
import '../../models/beneficiary.dart';
import '../../theme/theme_provider.dart';
import 'transfer_success_screen.dart';

// Custom input formatter for account numbers (letters + numbers)
class AccountNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Allow only alphanumeric characters and uppercase
    final filtered = newValue.text.toUpperCase().replaceAll(
      RegExp(r'[^A-Z0-9]'),
      '',
    );

    return TextEditingValue(
      text: filtered,
      selection: TextSelection.collapsed(offset: filtered.length),
    );
  }
}

class TransferScreen extends StatefulWidget {
  final Account? initialFrom;
  final Beneficiary? initialTo;
  const TransferScreen({super.key, this.initialFrom, this.initialTo});

  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen>
    with TickerProviderStateMixin {
  final BankingService _service = BankingService(ApiClient());
  List<Account> _accounts = [];
  List<Beneficiary> _beneficiaries = [];
  Account? _from;
  Beneficiary? _to;

  // Controllers
  final _amountCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final _toAccountCtrl = TextEditingController();
  final _toNameCtrl = TextEditingController();

  // State
  bool _submitting = false;
  String? _error;
  String? _success;
  bool _isLoading = true;
  bool _isVerifying = false;
  String? _verifiedAccountName;
  String? _verificationError;
  String? _amountError;

  // OTP State
  String? _transactionId;
  String? _transactionNumber;
  final _otpCtrl = TextEditingController();
  bool _isVerifyingOtp = false;

  // Animation
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    _toAccountCtrl.dispose();
    _toNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      // If user has not set transaction PIN, force set before proceeding
      try {
        final has = await SecurityService(ApiClient()).hasPin();
        if (!has && mounted) {
          await _promptSetPin();
        }
      } catch (_) {}

      final accounts = await _service.getAccounts();
      final bens = await _service.getBeneficiaries();
      setState(() {
        _accounts = accounts;
        _beneficiaries = bens;
        _isLoading = false;

        // Set sender account first
        if (widget.initialFrom != null) {
          _from = accounts.firstWhere(
            (a) => a.id == widget.initialFrom!.id,
            orElse: () =>
                accounts.isNotEmpty ? accounts.first : widget.initialFrom!,
          );
        } else if (accounts.isNotEmpty) {
          _from = accounts.first;
        }

        // Set recipient data and auto-fill note
        if (widget.initialTo != null) {
          print('🔍 Transfer Screen: Setting initialTo data:');
          print(
            '🔍 Transfer Screen: - Account Number: ${widget.initialTo!.accountNumber}',
          );
          print('🔍 Transfer Screen: - Name: ${widget.initialTo!.name}');
          print(
            '🔍 Transfer Screen: - Bank Name: ${widget.initialTo!.bankName}',
          );

          _to = widget.initialTo;
          _toAccountCtrl.text = widget.initialTo!.accountNumber;
          _toNameCtrl.text = widget.initialTo!.name;
          _verifiedAccountName = widget.initialTo!.name; // Set verified name

          // Tự động điền nội dung chuyển khoản: "<Tên người gửi> chuyển khoản"
          if (_from != null) {
            final senderName = _from!.accountName;
            _noteCtrl.text = '$senderName chuyển khoản';
            print('🔍 Transfer Screen: Auto-filled note: ${_noteCtrl.text}');
          }

          print(
            '🔍 Transfer Screen: Set _verifiedAccountName: $_verifiedAccountName',
          );
        }
      });
      _animationController.forward();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _submit() async {
    // Require transaction PIN before initiating transfer
    try {
      final pin = await _askForPin();
      if (pin == null) return; // cancelled
      final sec = SecurityService(ApiClient());
      await sec.verifyPin(pin);
    } catch (e) {
      _showError('PIN không hợp lệ: $e');
      return;
    }
    if (_from == null) {
      _showError('Vui lòng chọn tài khoản nguồn');
      return;
    }

    if (_toAccountCtrl.text.isEmpty) {
      _showError('Vui lòng nhập số tài khoản người nhận');
      return;
    }

    if (_verifiedAccountName == null) {
      _showError(
        'Vui lòng kiểm tra tài khoản người nhận trước khi chuyển tiền',
      );
      return;
    }

    if (_verificationError != null) {
      _showError('Tài khoản người nhận không hợp lệ');
      return;
    }

    // Validate amount error
    if (_amountError != null) {
      _showError(_amountError!);
      return;
    }

    final amount = double.tryParse(_amountCtrl.text);
    if (amount == null || amount <= 0) {
      _showError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setState(() => _submitting = true);

    try {
      final result = await _service.transfer(
        fromAccountId: _from!.id,
        toAccountNumber: _toAccountCtrl.text,
        toAccountName: _verifiedAccountName!,
        amount: amount,
        note: _noteCtrl.text,
      );

      // Check if OTP is required
      if (result['data']?['requiresOtp'] == true) {
        setState(() {
          _transactionId = result['data']['transactionId'];
          _transactionNumber =
              result['data']['pendingTransactionId']; // Use pending ID instead
          _submitting = false;
        });

        _showSuccess(
          'Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để hoàn tất giao dịch.',
        );
        _showOtpModal();
      } else {
        _showSuccess('Chuyển tiền thành công!');
        _clearForm();
      }
    } catch (e) {
      _handleApiError(e);
      setState(() => _submitting = false);
    }
  }

  Future<String?> _askForPin() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nhập PIN giao dịch'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 6,
          decoration: const InputDecoration(hintText: 'PIN 4-6 số'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );
    if (ok == true) return ctrl.text.trim();
    return null;
  }

  Future<void> _promptSetPin() async {
    final ctrl = TextEditingController();
    final ctrlConfirm = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Thiết lập PIN giao dịch'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 6,
              decoration: const InputDecoration(hintText: 'Nhập PIN (4-6 số)'),
            ),
            TextField(
              controller: ctrlConfirm,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 6,
              decoration: const InputDecoration(hintText: 'Nhập lại PIN'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Thoát'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final pin = ctrl.text.trim();
      final pin2 = ctrlConfirm.text.trim();
      if (pin.length < 4 || pin.length > 6 || pin != pin2) {
        _showError('PIN không hợp lệ hoặc không khớp');
        return _promptSetPin();
      }
      try {
        await SecurityService(ApiClient()).setPin(pin);
        _showSuccess('Thiết lập PIN thành công');
      } catch (e) {
        _showError('Không thể lưu PIN: $e');
        return _promptSetPin();
      }
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.isEmpty) {
      _showError('Vui lòng nhập mã OTP');
      return;
    }

    if (_transactionId == null) {
      _showError('Không tìm thấy thông tin giao dịch');
      return;
    }

    setState(() => _isVerifyingOtp = true);

    try {
      final result = await _service.verifyTransferOtp(
        transactionId: _transactionId!,
        otpCode: _otpCtrl.text,
      );

      // Close modal
      Navigator.of(context).pop();

      // Debug: Print the response to see what fields are available
      print('🔍 OTP Verification Response: ${result}');

      // Navigate to success screen with complete transaction data
      final successData = {
        'transactionNumber':
            result['data']?['transactionNumber'] ??
            result['data']?['id'] ??
            result['data']?['transactionId'] ??
            'GD${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
        'amount': _amountCtrl.text.isNotEmpty
            ? double.tryParse(_amountCtrl.text)
            : 0,
        'toAccountName':
            result['data']?['toAccountName'] ??
            result['data']?['recipientName'] ??
            _verifiedAccountName ??
            'N/A',
        'toAccountNumber':
            result['data']?['toAccountNumber'] ??
            result['data']?['recipientAccountNumber'] ??
            (_toAccountCtrl.text.isNotEmpty ? _toAccountCtrl.text : 'N/A'),
        'description': _noteCtrl.text.isNotEmpty ? _noteCtrl.text : null,
        'createdAt': DateTime.now(),
        'fee': result['data']?['fee'] ?? 0,
      };

      print('🔍 Success Data: ${successData}');

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) =>
              TransferSuccessScreen(transactionData: successData),
        ),
      );
    } catch (e) {
      _handleApiError(e);
    } finally {
      setState(() => _isVerifyingOtp = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_transactionId == null) {
      _showError('Không tìm thấy thông tin giao dịch');
      return;
    }

    try {
      await _service.resendTransferOtp(transactionId: _transactionId!);
      _showSuccess('Mã OTP mới đã được gửi đến email của bạn');
    } catch (e) {
      _handleApiError(e);
    }
  }

  void _validateAmount() {
    final amount = double.tryParse(_amountCtrl.text);
    if (amount != null && _from != null) {
      if (amount > _from!.availableBalance) {
        setState(() {
          _amountError = 'Số tiền vượt quá số dư khả dụng';
        });
      } else {
        setState(() {
          _amountError = null;
        });
      }
    } else {
      setState(() {
        _amountError = null;
      });
    }
  }

  void _clearForm() {
    setState(() {
      _transactionId = null;
      _transactionNumber = null;
      _verifiedAccountName = null;
      _verificationError = null;
      _amountError = null;
    });

    _amountCtrl.clear();
    _noteCtrl.clear();
    _toAccountCtrl.clear();
    _toNameCtrl.clear();
    _otpCtrl.clear();
  }

  void _showOtpModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withOpacity(0.5),
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.6,
              maxWidth: 350,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.security,
                          color: Color(0xFF3B82F6),
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Xác thực OTP',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Transaction Info (Compact)
                  if (_amountCtrl.text.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.pending_actions,
                                color: Color(0xFFF59E0B),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Giao dịch đang chờ xác thực',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF6B7280),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.attach_money,
                                color: Color(0xFF059669),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Số tiền:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF6B7280),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  '${_formatCurrency(double.tryParse(_amountCtrl.text) ?? 0)} VND',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF059669),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 20),

                  // OTP Input
                  const Text(
                    'Nhập mã OTP',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF374151),
                    ),
                  ),

                  const SizedBox(height: 12),

                  TextFormField(
                    controller: _otpCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 3,
                      color: Color(0xFF1F2937),
                    ),
                    decoration: InputDecoration(
                      hintText: '••••••',
                      hintStyle: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w400,
                        letterSpacing: 3,
                        color: Color(0xFF9CA3AF),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF3B82F6),
                          width: 2,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 12,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Info
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: Color(0xFFF59E0B),
                          size: 14,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Giao dịch sẽ được thực hiện sau khi xác thực OTP',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF92400E),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isVerifyingOtp ? null : _resendOtp,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF3B82F6)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text(
                            'Gửi lại',
                            style: TextStyle(
                              color: Color(0xFF3B82F6),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: _isVerifyingOtp ? null : _verifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF3B82F6),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: _isVerifyingOtp
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : const Text(
                                  'Xác thực',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _handleApiError(dynamic error) {
    if (error.toString().contains('401') ||
        error.toString().contains('Unauthorized')) {
      // Token expired - show modal
      AuthService.showTokenExpirationModal(context);
    } else {
      _showError('Lỗi: ${error.toString()}');
    }
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _fetchRecipientInfo(String accountNumber) async {
    if (accountNumber.length < 6) {
      setState(() {
        _verifiedAccountName = null;
        _verificationError = null;
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _verificationError = null;
    });

    try {
      final result = await _service.verifyAccount(accountNumber);
      if (result['success'] == true && result['data'] != null) {
        final accountData = result['data'];
        setState(() {
          _verifiedAccountName = accountData['accountName'];
          _verificationError = null;
          _toNameCtrl.text = _verifiedAccountName ?? '';
        });
      } else {
        setState(() {
          _verifiedAccountName = null;
          _verificationError = result['message'] ?? 'Không tìm thấy tài khoản';
          _toNameCtrl.clear();
        });
      }
    } catch (e) {
      _handleApiError(e);
      setState(() {
        _verifiedAccountName = null;
        _verificationError = e.toString().contains('Không tìm thấy tài khoản')
            ? 'Không tìm thấy tài khoản'
            : 'Lỗi xác thực tài khoản';
        _toNameCtrl.clear();
      });
    } finally {
      setState(() {
        _isVerifying = false;
      });
    }
  }

  String _formatCurrency(double amount) {
    return amount
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
      ),
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }

  Widget _buildInputField(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 4),

        const SizedBox(height: 12),
        child,
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      appBar: AppBar(
        backgroundColor: ThemeProvider.goldMetallicAccent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Chuyển tiền',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : FadeTransition(
              opacity: _fadeAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Main Transfer Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2A2A2A),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFDAA520).withOpacity(0.3),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: ThemeProvider.goldMetallicAccent.withValues(
                              alpha: 0.2,
                            ),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      ThemeProvider
                                          .goldMetallicAccent, // Dark Goldenrod
                                      ThemeProvider
                                          .goldMetallicSecondary, // Dark Goldenrod
                                      ThemeProvider
                                          .goldMetallicPrimary, // Goldenrod
                                    ],
                                    stops: const [0.0, 0.5, 1.0],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Ionicons.swap_horizontal,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              const Expanded(
                                child: Text(
                                  'Chuyển tiền nhanh chóng và an toàn',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),

                          // From Account
                          _buildInputField(
                            'Tài khoản nguồn',
                            DropdownButtonFormField<Account>(
                              value: _from,
                              decoration: _inputDecoration('Chọn tài khoản'),
                              items: _accounts
                                  .map(
                                    (a) => DropdownMenuItem(
                                      value: a,
                                      child: Text(
                                        '${a.accountNumber} - ${a.accountName}',
                                        style: const TextStyle(fontSize: 14),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (v) => setState(() => _from = v),
                              isExpanded: true,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // To Account
                          _buildInputField(
                            'Số tài khoản người nhận',
                            TextFormField(
                              controller: _toAccountCtrl,
                              decoration: _inputDecoration('Nhập số tài khoản')
                                  .copyWith(
                                    prefixIcon: null,
                                    suffixIcon: _isVerifying
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : _verifiedAccountName != null
                                        ? const Icon(
                                            Icons.check_circle,
                                            color: Colors.green,
                                          )
                                        : _verificationError != null
                                        ? const Icon(
                                            Icons.error,
                                            color: Colors.red,
                                          )
                                        : null,
                                  ),
                              keyboardType: TextInputType.text,
                              inputFormatters: [
                                AccountNumberFormatter(),
                                LengthLimitingTextInputFormatter(20),
                              ],
                              onChanged: (v) => _fetchRecipientInfo(v),
                            ),
                          ),

                          // Verification Status - removed as requested
                          if (_verificationError != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(
                                    0xFFEF4444,
                                  ).withOpacity(0.3),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error,
                                    color: Color(0xFFEF4444),
                                    size: 16,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _verificationError!,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFFEF4444),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Recipient Name (Only show when verified)
                          Builder(
                            builder: (context) {
                              print(
                                '🔍 Transfer Screen UI: _verifiedAccountName = $_verifiedAccountName',
                              );
                              return const SizedBox.shrink();
                            },
                          ),
                          if (_verifiedAccountName != null) ...[
                            const SizedBox(height: 24),
                            _buildInputField(
                              'Tên người nhận',
                              TextFormField(
                                controller: _toNameCtrl,
                                decoration: _inputDecoration('Tên người nhận')
                                    .copyWith(
                                      suffixIcon: const Icon(
                                        Icons.verified,
                                        color: Colors.green,
                                      ),
                                    ),
                                readOnly: true,
                                style: const TextStyle(
                                  color: Color(0xFF2C3E50),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),

                          // Amount
                          _buildInputField(
                            'Số tiền',
                            TextFormField(
                              controller: _amountCtrl,
                              decoration: _inputDecoration('Nhập số tiền')
                                  .copyWith(
                                    suffixIcon: TextButton(
                                      onPressed: () {
                                        _amountCtrl.text =
                                            _from?.availableBalance
                                                .toString() ??
                                            '';
                                        _validateAmount();
                                      },
                                      child: const Text(
                                        'Tất cả',
                                        style: TextStyle(
                                          color: Color(0xFF6366F1),
                                        ),
                                      ),
                                    ),
                                  ),
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(15),
                              ],
                              onChanged: (value) => _validateAmount(),
                            ),
                          ),

                          // Amount Error Display
                          if (_amountError != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(
                                    0xFFEF4444,
                                  ).withOpacity(0.3),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error,
                                    color: Color(0xFFEF4444),
                                    size: 16,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _amountError!,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFFEF4444),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          if (_from != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0F9FF),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: const Color(
                                    0xFF3B82F6,
                                  ).withOpacity(0.2),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.account_balance_wallet,
                                    color: Color(0xFF3B82F6),
                                    size: 20,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Số dư khả dụng: ${_formatCurrency(_from!.availableBalance)} VND',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF3B82F6),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),

                          // Note
                          _buildInputField(
                            'Nội dung giao dịch',
                            TextFormField(
                              controller: _noteCtrl,
                              decoration: _inputDecoration(
                                'Nhập nội dung giao dịch',
                              ),
                              maxLines: 2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: _submitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.send, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Chuyển tiền',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
