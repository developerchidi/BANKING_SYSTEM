import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:ionicons/ionicons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../widgets/info_dialog.dart';
import 'dart:convert';
import '../../services/auth_service.dart';
import '../../services/http_client.dart';
import '../../theme/app_theme.dart';

class DateInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text;

    if (text.length <= 8) {
      String formatted = text;

      if (text.length >= 2) {
        formatted = '${text.substring(0, 2)}/';
        if (text.length > 2) {
          formatted += text.substring(2);
        }
      }

      if (text.length >= 4) {
        formatted = '${text.substring(0, 2)}/${text.substring(2, 4)}/';
        if (text.length > 4) {
          formatted += text.substring(4);
        }
      }

      return TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    }

    return oldValue;
  }
}

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _cohortController = TextEditingController();
  final _schoolController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  final _currentAddressController = TextEditingController();
  final _permanentAddressController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  final _occupationController = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _agreeToTerms = false;
  bool _isLoading = false;

  String _selectedGender = '';
  String _selectedNationality = 'Vietnamese';

  int _currentStep = 0;
  final PageController _pageController = PageController();

  // Date picker
  DateTime? _selectedDateOfBirth;

  String? _parseDateFromTextField(String dateText) {
    if (dateText.isEmpty) return null;

    try {
      // Remove slashes and get only digits
      final digits = dateText.replaceAll('/', '');
      if (digits.length == 8) {
        final day = int.parse(digits.substring(0, 2));
        final month = int.parse(digits.substring(2, 4));
        final year = int.parse(digits.substring(4, 8));

        final date = DateTime(year, month, day);
        return date.toIso8601String();
      }
    } catch (e) {
      // Invalid date format
    }

    return null;
  }

  void _showTermsModal() {
    showDialog(
      context: context,
      builder: (context) => InfoDialog(
        title: 'Điều khoản sử dụng',
        icon: Icons.article_outlined,
        content: const _TermsContent(),
      ),
    );
  }

  void _showPrivacyModal() {
    showDialog(
      context: context,
      builder: (context) => InfoDialog(
        title: 'Chính sách bảo mật',
        icon: Icons.privacy_tip_outlined,
        content: const _PrivacyContent(),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _studentIdController.dispose();
    _cohortController.dispose();
    _schoolController.dispose();
    _dateOfBirthController.dispose();
    _currentAddressController.dispose();
    _permanentAddressController.dispose();
    _emergencyContactController.dispose();
    _emergencyPhoneController.dispose();
    _occupationController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _nextStep() async {
    if (_currentStep == 0) {
      // Validate step 1 (basic personal info)
      if (_firstNameController.text.trim().isEmpty ||
          _lastNameController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập đầy đủ họ và tên'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } else if (_currentStep == 1) {
      // Validate step 2 (personal details)
      if (_dateOfBirthController.text.trim().isEmpty ||
          _selectedGender.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập đầy đủ thông tin cá nhân'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Validate date of birth format and range
      final dateText = _dateOfBirthController.text.trim();
      if (dateText.length != 10 || !dateText.contains('/')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ngày sinh phải có định dạng dd/mm/yyyy'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      try {
        final parts = dateText.split('/');
        if (parts.length != 3) {
          throw Exception('Invalid format');
        }

        final day = int.parse(parts[0]);
        final month = int.parse(parts[1]);
        final year = int.parse(parts[2]);

        // Validate day range
        if (day < 1 || day > 31) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ngày phải từ 1 đến 31'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Validate month range
        if (month < 1 || month > 12) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Tháng phải từ 1 đến 12'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Validate year range (1990 to current year)
        final currentYear = DateTime.now().year;
        if (year < 1990 || year > currentYear) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Năm phải từ 1990 đến $currentYear'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Validate if date is valid (e.g., 31/02 is invalid)
        final date = DateTime(year, month, day);
        if (date.year != year || date.month != month || date.day != day) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ngày sinh không hợp lệ'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Validate if date is not in the future
        if (date.isAfter(DateTime.now())) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ngày sinh không thể là ngày trong tương lai'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        // Validate age must be at least 16 years old
        final now = DateTime.now();
        final age = now.year - date.year;
        final monthDiff = now.month - date.month;
        final dayDiff = now.day - date.day;

        // Calculate exact age considering month and day
        final exactAge =
            age - (monthDiff < 0 || (monthDiff == 0 && dayDiff < 0) ? 1 : 0);

        if (exactAge < 16) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Bạn phải đủ 16 tuổi để đăng ký tài khoản'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ngày sinh không hợp lệ'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Validate gender (only Male/Female allowed)
      if (_selectedGender != 'Male' && _selectedGender != 'Female') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Giới tính chỉ có thể là Nam hoặc Nữ'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } else if (_currentStep == 2) {
      // Validate step 3 (contact info) and check in database
      if (_emailController.text.trim().isEmpty ||
          _phoneController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập đầy đủ email và số điện thoại'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Validate email format
      if (!RegExp(
        r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
      ).hasMatch(_emailController.text.trim())) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email không hợp lệ'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Validate phone format
      if (_phoneController.text.trim().length != 10) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Số điện thoại phải có 10 chữ số'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Check email and phone existence
      setState(() => _isLoading = true);
      try {
        final api = ApiClient();

        // Check email existence
        final emailResponse = await api.get(
          '/api/auth/check-email?email=${_emailController.text.trim()}',
        );
        final emailData = jsonDecode(emailResponse.body);

        if (emailData['exists'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                emailData['message'] ?? 'Email này đã được sử dụng',
              ),
              backgroundColor: Colors.red,
            ),
          );
          setState(() => _isLoading = false);
          return;
        }

        // Check phone existence
        final phoneResponse = await api.get(
          '/api/auth/check-phone?phone=${_phoneController.text.trim()}',
        );
        final phoneData = jsonDecode(phoneResponse.body);

        if (phoneData['exists'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                phoneData['message'] ?? 'Số điện thoại này đã được sử dụng',
              ),
              backgroundColor: Colors.red,
            ),
          );
          setState(() => _isLoading = false);
          return;
        }

        setState(() => _isLoading = false);
      } catch (e) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi kiểm tra: $e'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } else if (_currentStep == 3) {
      // Validate step 4 (student info)
      if (_studentIdController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập mã số sinh viên'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Check student ID existence
      setState(() => _isLoading = true);
      try {
        final api = ApiClient();
        final studentIdResponse = await api.get(
          '/api/auth/check-student-id?studentId=${_studentIdController.text.trim()}',
        );
        final studentIdData = jsonDecode(studentIdResponse.body);

        if (studentIdData['exists'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                studentIdData['message'] ??
                    'Mã số sinh viên này đã được sử dụng',
              ),
              backgroundColor: Colors.red,
            ),
          );
          setState(() => _isLoading = false);
          return;
        }

        setState(() => _isLoading = false);
      } catch (e) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi kiểm tra: $e'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    } else if (_currentStep == 4) {
      // Validate step 5 (address info)
      if (_currentAddressController.text.trim().isEmpty ||
          _permanentAddressController.text.trim().isEmpty ||
          _emergencyContactController.text.trim().isEmpty ||
          _emergencyPhoneController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng nhập đầy đủ thông tin địa chỉ'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Validate emergency phone format
      if (_emergencyPhoneController.text.trim().length != 10) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Số điện thoại liên hệ khẩn cấp phải có 10 chữ số'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }

    if (_currentStep < 5) {
      setState(() => _currentStep++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      // Final step - create account
      setState(() => _isLoading = true);

      try {
        print(
          '🔐 Register: Starting registration for ${_emailController.text.trim()}',
        );
        // Call backend to create account
        final api = ApiClient();
        final response = await api.post(
          '/api/auth/register',
          body: {
            'email': _emailController.text.trim(),
            'password': _passwordController.text,
            'firstName': _firstNameController.text.trim(),
            'lastName': _lastNameController.text.trim(),
            'phoneNumber': _phoneController.text.trim(),
            'studentId': _studentIdController.text.trim(),
            'cohort': _cohortController.text.trim().isNotEmpty
                ? _cohortController.text.trim()
                : null,
            'school': _schoolController.text.trim().isNotEmpty
                ? _schoolController.text.trim()
                : null,
            'termsAccepted': _agreeToTerms,
            'termsVersion': '1.0',

            // Personal Information
            'dateOfBirth': _parseDateFromTextField(
              _dateOfBirthController.text.trim(),
            ),
            'gender': _selectedGender.isNotEmpty ? _selectedGender : null,
            'nationality': _selectedNationality,

            // Address Information
            'currentAddress': _currentAddressController.text.trim(),
            'permanentAddress': _permanentAddressController.text.trim(),
            'emergencyContact': _emergencyContactController.text.trim(),
            'emergencyPhone': _emergencyPhoneController.text.trim(),
          },
          context: context,
        );

        print('🔐 Register: Response received: ${response.statusCode}');
        print('🔐 Register: Response body: ${response.body}');

        if (response.statusCode == 201) {
          final data = jsonDecode(response.body);
          print('🔐 Register: Registration successful: $data');

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                data['message'] ?? 'Đăng ký thành công! Vui lòng đăng nhập.',
              ),
              backgroundColor: Colors.green,
            ),
          );

          // Navigate back to login screen
          Navigator.pop(context);
        } else {
          final data = jsonDecode(response.body);
          print('🔐 Register: Registration failed: $data');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                data['message'] ?? 'Đăng ký thất bại. Vui lòng thử lại.',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        print('🔐 Register: Error during registration: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi đăng ký: $e'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đồng ý với điều khoản sử dụng'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      print(
        '🔐 Register: Starting registration for ${_emailController.text.trim()}',
      );
      // Call backend to create account
      final api = ApiClient();
      final response = await api.post(
        '/api/auth/register',
        body: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
          'studentId': _studentIdController.text.trim(),
          'cohort': _cohortController.text.trim().isNotEmpty
              ? _cohortController.text.trim()
              : null,
          'school': _schoolController.text.trim().isNotEmpty
              ? _schoolController.text.trim()
              : null,
          'termsAccepted': _agreeToTerms,
          'termsVersion': '1.0',

          // Personal Information
          'dateOfBirth': _parseDateFromTextField(
            _dateOfBirthController.text.trim(),
          ),
          'gender': _selectedGender.isNotEmpty ? _selectedGender : null,
          'nationality': _selectedNationality,

          // Address Information
          'currentAddress': _currentAddressController.text.trim(),
          'permanentAddress': _permanentAddressController.text.trim(),
          'emergencyContact': _emergencyContactController.text.trim(),
          'emergencyPhone': _emergencyPhoneController.text.trim(),
        },
        context: context,
      );

      print(
        '🔐 Register: Registration response status: ${response.statusCode}',
      );
      print('🔐 Register: Registration response body: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        print('🔐 Register: Registration successful, attempting auto-login');
        // Auto-login after register
        final authService = AuthService(ApiClient());
        try {
          final loginResult = await authService.login(
            _studentIdController.text.trim(),
            _passwordController.text,
          );
          print('🔐 Register: Auto-login successful: $loginResult');

          // Check if tokens were stored
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('accessToken');
          final refreshToken = prefs.getString('refreshToken');
          print(
            '🔐 Register: Access token stored after login: ${token != null ? 'Yes' : 'No'}',
          );
          print('🔐 Register: Access token length: ${token?.length ?? 0}');
          print(
            '🔐 Register: Refresh token stored after login: ${refreshToken != null ? 'Yes' : 'No'}',
          );
          print(
            '🔐 Register: Refresh token length: ${refreshToken?.length ?? 0}',
          );

          // Navigate directly to main app (dashboard)
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Đăng ký thành công! Chào mừng bạn đến với Chidi Bank!',
                ),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 3),
              ),
            );

            // Navigate to main app
            Navigator.pushReplacementNamed(context, '/app');
          }
        } catch (e) {
          print('🔐 Register: Auto-login failed: $e');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công.',
              ),
              backgroundColor: Colors.orange,
            ),
          );

          // Navigate to login screen as fallback
          if (mounted) {
            Navigator.pushReplacementNamed(context, '/login');
          }
        }
      } else {
        throw Exception('Đăng ký thất bại: ${response.statusCode}');
      }
    } catch (e) {
      print('🔐 Register: Registration error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi đăng ký: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 375;
    final isMedium = size.width >= 375 && size.width < 414;
    final isLarge = size.width >= 414 && size.width < 768;
    final isTablet = size.width >= 768 && size.width < 1024;
    final isDesktop = size.width >= 1024;

    // Responsive values
    final padding = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));
    final titleFont = isSmall
        ? 24.0
        : (isMedium ? 28.0 : (isLarge ? 32.0 : (isTablet ? 36.0 : 40.0)));
    final subFont = isSmall
        ? 12.0
        : (isMedium ? 14.0 : (isLarge ? 16.0 : (isTablet ? 18.0 : 20.0)));
    final loginBtnHeight = isSmall
        ? 44.0
        : (isMedium ? 48.0 : (isLarge ? 52.0 : (isTablet ? 56.0 : 60.0)));
    final formMaxWidth = isTablet
        ? 500.0
        : (isDesktop ? 600.0 : double.infinity);
    final headerSpacing = isSmall
        ? 16.0
        : (isMedium ? 20.0 : (isLarge ? 24.0 : (isTablet ? 32.0 : 40.0)));

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.authBackground),
        child: RepaintBoundary(
          child: Stack(
            children: [
              // Decorative blobs
              Positioned(
                top: -50,
                left: -50,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: const Color(0xFFA855F7).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              Positioned(
                top: 100,
                right: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBBF24).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              Positioned(
                bottom: 100,
                left: 50,
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEC4899).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(1000),
                  ),
                ),
              ),
              // Main content
              SafeArea(
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  padding: EdgeInsets.symmetric(horizontal: padding),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight:
                          MediaQuery.of(context).size.height -
                          MediaQuery.of(context).padding.top -
                          MediaQuery.of(context).padding.bottom,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: headerSpacing),
                        // Header brand
                        Row(
                          children: [
                            DecoratedBox(
                              decoration: BoxDecoration(
                                color: const Color(0xFFA855F7),
                                borderRadius: BorderRadius.all(
                                  Radius.circular(isSmall ? 6 : 8),
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(isSmall ? 6 : 8),
                                child: Icon(
                                  Ionicons.shield_checkmark,
                                  color: Colors.white,
                                  size: isSmall ? 16 : 20,
                                ),
                              ),
                            ),
                            SizedBox(width: isSmall ? 8 : 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'CHIDI BANK',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: isSmall ? 14 : 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Bảo mật • Nhanh chóng • Tin cậy',
                                  style: TextStyle(
                                    color: const Color(0xB3FFFFFF),
                                    fontSize: isSmall ? 10 : 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        SizedBox(height: isSmall ? 24 : 32),
                        // Welcome title
                        Text(
                          'Đăng ký ngay',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: titleFont,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                        Text(
                          'Chidi BANK',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xFFA855F7),
                            fontSize: titleFont + (isSmall ? 2 : 4),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: isSmall ? 12 : 16),
                        Text(
                          'Tham gia hàng ngàn khách hàng hài lòng và trải nghiệm ngân hàng số hiện đại.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: const Color(0xCCFFFFFF),
                            fontSize: subFont,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Form container with responsive max width
                        Center(
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: formMaxWidth),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.06),
                                borderRadius: BorderRadius.circular(
                                  isSmall ? 10 : 12,
                                ),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.08),
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.all(isSmall ? 16 : 20),
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    children: [
                                      // PageView for steps
                                      SizedBox(
                                        height: 450,
                                        child: PageView(
                                          controller: _pageController,
                                          physics:
                                              const NeverScrollableScrollPhysics(),
                                          children: [
                                            // Step 1: Basic Personal Information
                                            SingleChildScrollView(
                                              child: _buildStep1(),
                                            ),
                                            // Step 2: Personal Details
                                            SingleChildScrollView(
                                              child: _buildStep2(),
                                            ),
                                            // Step 3: Contact Information
                                            SingleChildScrollView(
                                              child: _buildStep3(),
                                            ),
                                            // Step 4: Student Information
                                            SingleChildScrollView(
                                              child: _buildStep4(),
                                            ),
                                            // Step 5: Address Information
                                            SingleChildScrollView(
                                              child: _buildStep6(),
                                            ),
                                            // Step 6: Password & Terms
                                            SingleChildScrollView(
                                              child: _buildStep7(),
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(height: 16),

                                      // Navigation buttons
                                      Row(
                                        children: [
                                          if (_currentStep > 0)
                                            Expanded(
                                              child: OutlinedButton(
                                                onPressed: _previousStep,
                                                style: OutlinedButton.styleFrom(
                                                  side: const BorderSide(
                                                    color: Color(0xFFA855F7),
                                                  ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          16,
                                                        ),
                                                  ),
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        vertical: 16,
                                                      ),
                                                ),
                                                child: const Text(
                                                  'Trước đó',
                                                  style: TextStyle(
                                                    color: Color(0xFFA855F7),
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          if (_currentStep > 0)
                                            const SizedBox(width: 12),
                                          Expanded(
                                            child: Container(
                                              height: loginBtnHeight,
                                              decoration: BoxDecoration(
                                                gradient: const LinearGradient(
                                                  colors: [
                                                    Color(0xFFA855F7),
                                                    Color(0xFF7C3AED),
                                                  ],
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black
                                                        .withOpacity(0.3),
                                                    offset: const Offset(0, 4),
                                                    blurRadius: 8,
                                                  ),
                                                ],
                                              ),
                                              child: ElevatedButton(
                                                onPressed: _currentStep == 6
                                                    ? (_isLoading
                                                          ? null
                                                          : _register)
                                                    : _nextStep,
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor:
                                                      Colors.transparent,
                                                  shadowColor:
                                                      Colors.transparent,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          16,
                                                        ),
                                                  ),
                                                ),
                                                child: _isLoading
                                                    ? const SizedBox(
                                                        height: 22,
                                                        width: 22,
                                                        child:
                                                            CircularProgressIndicator(
                                                              strokeWidth: 2,
                                                              color:
                                                                  Colors.white,
                                                            ),
                                                      )
                                                    : Text(
                                                        _currentStep == 5
                                                            ? 'Tạo tài khoản'
                                                            : 'Tiếp theo',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 12),
                                      Wrap(
                                        alignment: WrapAlignment.center,
                                        spacing: 4,
                                        children: [
                                          const Text(
                                            "Đã có tài khoản?",
                                            style: TextStyle(
                                              color: Color(0xB3FFFFFF),
                                              fontSize: 14,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => Navigator.pop(context),
                                            child: const Text(
                                              'Đăng nhập',
                                              style: TextStyle(
                                                color: Color(0xFFA855F7),
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: isSmall ? 20 : 24),
                      ],
                    ),
                  ),
                ),
              ),
              // Version info - Fixed at bottom
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: padding,
                      vertical: isSmall ? 12 : 16,
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Version 1.0.0',
                          style: TextStyle(
                            color: const Color(0x99FFFFFF),
                            fontSize: isSmall ? 10 : 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: isSmall ? 2 : 4),
                        Text(
                          '© 2025 Chidi Bank. All rights reserved.',
                          style: TextStyle(
                            color: const Color(0x80FFFFFF),
                            fontSize: isSmall ? 9 : 11,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Thông tin cơ bản', Ionicons.person_outline),
        const SizedBox(height: 16),

        // First Name field
        _buildInputField(
          controller: _firstNameController,
          label: 'Họ',
          hint: 'Nhập họ của bạn',
          validator: (v) =>
              (v == null || v.isEmpty) ? 'Vui lòng nhập họ' : null,
        ),
        const SizedBox(height: 16),

        // Last Name field
        _buildInputField(
          controller: _lastNameController,
          label: 'Tên',
          hint: 'Nhập tên của bạn',
          validator: (v) =>
              (v == null || v.isEmpty) ? 'Vui lòng nhập tên' : null,
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Thông tin cá nhân', Ionicons.calendar_outline),
        const SizedBox(height: 16),

        // Date of Birth field
        _buildDateField(
          controller: _dateOfBirthController,
          label: 'Ngày sinh',
          hint: 'dd/mm/yyyy',
          selectedDate: _selectedDateOfBirth,
          onDateSelected: (date) {
            setState(() {
              _selectedDateOfBirth = date;
              _dateOfBirthController.text =
                  '${date.day}/${date.month}/${date.year}';
            });
          },
        ),
        const SizedBox(height: 16),

        // Gender field (hiển thị VN, lưu EN)
        _buildDropdownField(
          label: 'Giới tính',
          value: _selectedGender == 'Male'
              ? 'Nam'
              : _selectedGender == 'Female'
              ? 'Nữ'
              : '',
          items: ['Nam', 'Nữ'],
          onChanged: (value) => setState(() {
            if (value == 'Nam') _selectedGender = 'Male';
            if (value == 'Nữ') _selectedGender = 'Female';
          }),
        ),
        const SizedBox(height: 16),

        // Nationality field (hiển thị VN, lưu EN)
        _buildDropdownField(
          label: 'Quốc tịch',
          value: _selectedNationality == 'Vietnamese'
              ? 'Việt Nam'
              : _selectedNationality == 'Other'
              ? 'Khác'
              : 'Việt Nam',
          items: ['Việt Nam', 'Khác'],
          onChanged: (value) => setState(() {
            if (value == 'Việt Nam') _selectedNationality = 'Vietnamese';
            if (value == 'Khác') _selectedNationality = 'Other';
          }),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Thông tin liên hệ', Ionicons.mail_outline),
        const SizedBox(height: 16),

        // Email field
        _buildInputField(
          controller: _emailController,
          label: 'Email',
          hint: 'Nhập email của bạn',
          keyboardType: TextInputType.emailAddress,
          validator: (v) {
            if (v == null || v.isEmpty) return 'Vui lòng nhập email';
            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) {
              return 'Định dạng email không hợp lệ';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),

        // Phone field
        _buildInputField(
          controller: _phoneController,
          label: 'Số điện thoại',
          hint: 'Nhập số điện thoại của bạn',
          keyboardType: TextInputType.phone,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          validator: (v) {
            if (v == null || v.isEmpty) return 'Vui lòng nhập số điện thoại';
            if (v.length != 10) return 'Số điện thoại phải có 10 chữ số';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildStep4() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Thông tin sinh viên', Ionicons.school_outline),
        const SizedBox(height: 16),

        // Student ID field
        _buildInputField(
          controller: _studentIdController,
          label: 'Mã số sinh viên',
          hint: 'Nhập mã số sinh viên',
          validator: (v) {
            if (v == null || v.isEmpty) return 'Vui lòng nhập mã số sinh viên';
            return null;
          },
        ),
        const SizedBox(height: 16),

        // Cohort field
        _buildInputField(
          controller: _cohortController,
          label: 'Khoá (Không bắt buộc)',
          hint: 'Nhập khoá học',
        ),
        const SizedBox(height: 16),

        // School field
        _buildInputField(
          controller: _schoolController,
          label: 'Trường (Không bắt buộc)',
          hint: 'Nhập tên trường',
        ),
      ],
    );
  }

  Widget _buildStep6() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Thông tin địa chỉ', Ionicons.location_outline),
        const SizedBox(height: 16),

        // Current Address field
        _buildInputField(
          controller: _currentAddressController,
          label: 'Địa chỉ hiện tại',
          hint: 'Nhập địa chỉ hiện tại',
          validator: (v) => (v == null || v.isEmpty)
              ? 'Vui lòng nhập địa chỉ hiện tại'
              : null,
        ),
        const SizedBox(height: 12),

        // Permanent Address field
        _buildInputField(
          controller: _permanentAddressController,
          label: 'Địa chỉ thường trú',
          hint: 'Nhập địa chỉ thường trú',
          validator: (v) => (v == null || v.isEmpty)
              ? 'Vui lòng nhập địa chỉ thường trú'
              : null,
        ),
        const SizedBox(height: 12),

        // Emergency Contact field
        _buildInputField(
          controller: _emergencyContactController,
          label: 'Người liên hệ khẩn cấp',
          hint: 'Nhập tên người liên hệ',
          validator: (v) => (v == null || v.isEmpty)
              ? 'Vui lòng nhập người liên hệ khẩn cấp'
              : null,
        ),
        const SizedBox(height: 12),

        // Emergency Phone field
        _buildInputField(
          controller: _emergencyPhoneController,
          label: 'SĐT liên hệ khẩn cấp',
          hint: 'Nhập SĐT liên hệ khẩn cấp',
          keyboardType: TextInputType.phone,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          validator: (v) {
            if (v == null || v.isEmpty) return 'Vui lòng nhập SĐT khẩn cấp';
            if (v.length != 10) return 'SĐT khẩn cấp phải có 10 chữ số';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildStep7() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Mật khẩu & Bảo mật', Ionicons.lock_closed_outline),
        const SizedBox(height: 12),

        // Password field
        StatefulBuilder(
          builder: (context, innerSetState) {
            return _buildInputField(
              controller: _passwordController,
              label: 'Mật khẩu',
              hint: 'Nhập mật khẩu của bạn',
              obscureText: !_showPassword,
              suffixIcon: IconButton(
                onPressed: () => innerSetState(() {
                  _showPassword = !_showPassword;
                }),
                icon: Icon(
                  _showPassword
                      ? Ionicons.eye_off_outline
                      : Ionicons.eye_outline,
                  color: const Color(0x80FFFFFF),
                  size: 20,
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu';
                if (v.length < 6) return 'Mật khẩu phải ít nhất 6 ký tự';
                return null;
              },
            );
          },
        ),
        const SizedBox(height: 12),

        // Confirm Password field
        StatefulBuilder(
          builder: (context, innerSetState) {
            return _buildInputField(
              controller: _confirmPasswordController,
              label: 'Xác nhận mật khẩu',
              hint: 'Nhập lại mật khẩu',
              obscureText: !_showConfirmPassword,
              suffixIcon: IconButton(
                onPressed: () => innerSetState(() {
                  _showConfirmPassword = !_showConfirmPassword;
                }),
                icon: Icon(
                  _showConfirmPassword
                      ? Ionicons.eye_off_outline
                      : Ionicons.eye_outline,
                  color: const Color(0x80FFFFFF),
                  size: 20,
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Vui lòng xác nhận mật khẩu';
                if (v != _passwordController.text) return 'Mật khẩu không khớp';
                return null;
              },
            );
          },
        ),

        const SizedBox(height: 12),

        // Terms checkbox
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Row(
            children: [
              Checkbox(
                value: _agreeToTerms,
                onChanged: (value) =>
                    setState(() => _agreeToTerms = value ?? false),
                activeColor: const Color(0xFFA855F7),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      color: Color(0xB3FFFFFF),
                      fontSize: 14,
                    ),
                    children: [
                      const TextSpan(text: 'Tôi đồng ý với '),
                      TextSpan(
                        text: 'Điều khoản sử dụng',
                        style: const TextStyle(
                          color: Color(0xFFA855F7),
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                        ),
                        recognizer: TapGestureRecognizer()
                          ..onTap = _showTermsModal,
                      ),
                      const TextSpan(text: ' và '),
                      TextSpan(
                        text: 'Chính sách bảo mật',
                        style: const TextStyle(
                          color: Color(0xFFA855F7),
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                        ),
                        recognizer: TapGestureRecognizer()
                          ..onTap = _showPrivacyModal,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: const Color(0xFFA855F7).withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, size: 16, color: const Color(0xFFA855F7)),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xE6FFFFFF),
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xE6FFFFFF),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0x1AFFFFFF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x33FFFFFF)),
          ),
          child: TextFormField(
            style: const TextStyle(color: Colors.white, fontSize: 16),
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            obscureText: obscureText,
            validator: validator,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Color(0x80FFFFFF)),
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required DateTime? selectedDate,
    required Function(DateTime) onDateSelected,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xE6FFFFFF),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0x1AFFFFFF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x33FFFFFF)),
          ),
          child: TextFormField(
            style: const TextStyle(color: Colors.white, fontSize: 16),
            controller: controller,
            keyboardType: TextInputType.datetime,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(8),
              DateInputFormatter(),
            ],
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                color: Color(0x80FFFFFF),
                fontSize: 16,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
            onChanged: (value) {
              if (value.length == 8) {
                try {
                  final day = int.parse(value.substring(0, 2));
                  final month = int.parse(value.substring(2, 4));
                  final year = int.parse(value.substring(4, 8));

                  if (day >= 1 &&
                      day <= 31 &&
                      month >= 1 &&
                      month <= 12 &&
                      year >= 1900 &&
                      year <= DateTime.now().year) {
                    final date = DateTime(year, month, day);
                    if (date.isBefore(DateTime.now())) {
                      onDateSelected(date);
                    }
                  }
                } catch (e) {
                  // Invalid date format
                }
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xE6FFFFFF),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0x1AFFFFFF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x33FFFFFF)),
          ),
          child: DropdownButtonFormField<String>(
            value: value.isNotEmpty ? value : null,
            dropdownColor: const Color(0xFF2A2A2A),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
            selectedItemBuilder: (BuildContext context) {
              return items.map<Widget>((String item) {
                return Container(
                  alignment: Alignment.centerLeft,
                  constraints: const BoxConstraints(minWidth: 0),
                  child: Text(
                    item,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList();
            },
            icon: Container(
              padding: const EdgeInsets.all(8),
              child: const Icon(
                Ionicons.chevron_down_outline,
                color: Color(0x80FFFFFF),
                size: 20,
              ),
            ),
            decoration: InputDecoration(
              hintText: 'Chọn $label',
              hintStyle: const TextStyle(
                color: Color(0x80FFFFFF),
                fontSize: 16,
                fontWeight: FontWeight.w400,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
            items: items.map((String item) {
              return DropdownMenuItem<String>(
                value: item,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    item,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              );
            }).toList(),
            onChanged: onChanged,
            menuMaxHeight: 200,
            isExpanded: true,
            borderRadius: BorderRadius.circular(12),
            elevation: 8,
          ),
        ),
      ],
    );
  }
}

class _TermsContent extends StatelessWidget {
  const _TermsContent({super.key});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: const TextSpan(
        style: TextStyle(color: Colors.black87, height: 1.6, fontSize: 16),
        children: [
          TextSpan(
            text: '1. Phạm vi áp dụng\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                'Điều khoản này điều chỉnh việc truy cập và sử dụng ứng dụng Chidi Bank, bao gồm mở tài khoản, giao dịch, quản lý thẻ, chuyển tiền, tiết kiệm và các dịch vụ liên quan.\n\n',
          ),
          TextSpan(
            text: '2. Định nghĩa\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- “Người dùng”: Cá nhân tạo và sử dụng tài khoản.\n- “Tài khoản”: Tài khoản thanh toán/tiết kiệm do Chidi Bank quản lý.\n- “Giao dịch”: Mọi lệnh chuyển tiền, nạp/rút, tính lãi, phí.\n\n',
          ),
          TextSpan(
            text: '3. Mở và quản lý tài khoản\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật.\n- Chidi Bank có thể yêu cầu KYC/xác minh bổ sung.\n- Bạn chịu trách nhiệm bảo quản thông tin đăng nhập, 2FA và mã PIN giao dịch.\n\n',
          ),
          TextSpan(
            text: '4. Bảo mật và 2FA\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Kích hoạt và duy trì 2FA theo yêu cầu bảo mật.\n- Không chia sẻ OTP/PIN với bất kỳ ai.\n- Báo ngay cho Chidi Bank khi nghi ngờ truy cập trái phép.\n\n',
          ),
          TextSpan(
            text: '5. Giao dịch và xử lý\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Giao dịch phát sinh theo lệnh của bạn sẽ được xử lý tự động.\n- Bạn cần kiểm tra thông tin người nhận trước khi xác nhận.\n- Giao dịch đã xác nhận có thể không thể hủy/sửa.\n\n',
          ),
          TextSpan(
            text: '6. Phí, lãi suất và thuế\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Biểu phí và lãi suất (nếu áp dụng) sẽ được công bố công khai, có thể điều chỉnh theo từng thời kỳ.\n- Lãi suất tiết kiệm tính theo năm, ghi có hàng tháng theo quy định.\n- Nghĩa vụ thuế thuộc về người dùng theo pháp luật hiện hành.\n\n',
          ),
          TextSpan(
            text: '7. Hạn mức và kiểm soát rủi ro\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Áp dụng hạn mức giao dịch/ngày nhằm phòng chống gian lận.\n- Có thể tạm khóa tài khoản khi phát hiện dấu hiệu bất thường hoặc vi phạm.\n\n',
          ),
          TextSpan(
            text: '8. Hành vi bị cấm\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Sử dụng dịch vụ cho mục đích bất hợp pháp, rửa tiền, lừa đảo.\n- Giả mạo danh tính, xâm nhập hệ thống, can thiệp vào vận hành.\n\n',
          ),
          TextSpan(
            text: '9. Trách nhiệm và giới hạn trách nhiệm\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Bạn chịu trách nhiệm với giao dịch phát sinh từ thiết bị/thông tin xác thực của mình.\n- Chidi Bank không chịu trách nhiệm với thiệt hại do lỗi bên thứ ba, sự kiện bất khả kháng, hoặc do bạn vi phạm điều khoản này.\n\n',
          ),
          TextSpan(
            text: '10. Tạm ngừng / Chấm dứt dịch vụ\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Chidi Bank có quyền tạm ngừng/chấm dứt dịch vụ khi: có yêu cầu của cơ quan có thẩm quyền; nghi ngờ gian lận; bạn vi phạm điều khoản.\n\n',
          ),
          TextSpan(
            text: '11. Sửa đổi điều khoản\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Điều khoản có thể được cập nhật. Thông tin thay đổi sẽ được thông báo trên ứng dụng/bản tin; việc tiếp tục sử dụng nghĩa là bạn đồng ý với phiên bản mới.\n\n',
          ),
          TextSpan(
            text: '12. Luật áp dụng và giải quyết tranh chấp\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Điều khoản được điều chỉnh bởi pháp luật Việt Nam.\n- Tranh chấp được thương lượng trước, nếu không thành sẽ xử lý theo thẩm quyền của tòa án có liên quan.\n\n',
          ),
          TextSpan(
            text: '13. Liên hệ hỗ trợ\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                'Email: support@chidibank.com | Hotline: 1900-xxxx | Thời gian: 08:00–22:00 (T2–CN).',
          ),
        ],
      ),
    );
  }
}

class _PrivacyContent extends StatelessWidget {
  const _PrivacyContent({super.key});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: const TextSpan(
        style: TextStyle(color: Colors.black87, height: 1.6, fontSize: 16),
        children: [
          TextSpan(
            text: '1. Loại dữ liệu thu thập\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Thông tin định danh: Họ tên, email, số điện thoại, quốc tịch, ngày sinh.\n- Thông tin tài khoản: Số tài khoản, số dư, lịch sử giao dịch, cấu hình bảo mật.\n- Dữ liệu kỹ thuật: Địa chỉ IP, thiết bị, log truy cập, cookie/SDK tương đương.\n\n',
          ),
          TextSpan(
            text: '2. Căn cứ xử lý dữ liệu\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Sự đồng ý của bạn;\n- Thực hiện hợp đồng/dịch vụ;\n- Tuân thủ nghĩa vụ pháp lý;\n- Lợi ích hợp pháp (phòng chống gian lận, bảo vệ an ninh).\n\n',
          ),
          TextSpan(
            text: '3. Mục đích sử dụng\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Xác thực và quản lý tài khoản, KYC (nếu có).\n- Xử lý giao dịch: chuyển tiền, nhận tiền, tính lãi, thông báo biến động.\n- Chăm sóc khách hàng, gửi thông báo dịch vụ/khuyến mại (nếu đồng ý).\n- Cải thiện chất lượng, an toàn hệ thống và thống kê nội bộ.\n\n',
          ),
          TextSpan(
            text: '4. Chia sẻ với bên thứ ba\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Nhà cung cấp dịch vụ: hạ tầng, thanh toán, thông báo đẩy, email.\n- Cơ quan nhà nước có thẩm quyền theo quy định pháp luật.\n- Không bán dữ liệu cá nhân. Mọi chia sẻ đều theo nguyên tắc tối thiểu cần thiết.\n\n',
          ),
          TextSpan(
            text: '5. Lưu trữ và thời hạn\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Lưu trữ tại trung tâm dữ liệu đáp ứng tiêu chuẩn an toàn.\n- Thời hạn: trong suốt thời gian bạn sử dụng dịch vụ và thêm một thời gian theo quy định (kế toán, thuế, tranh chấp).\n\n',
          ),
          TextSpan(
            text: '6. Biện pháp bảo mật\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Mã hóa dữ liệu, giới hạn truy cập, giám sát an ninh, 2FA/PIN.\n- Kiểm thử định kỳ, sao lưu và khôi phục sự cố.\n\n',
          ),
          TextSpan(
            text: '7. Quyền của người dùng\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Yêu cầu truy cập, chỉnh sửa, xoá, hạn chế xử lý, rút lại đồng ý.\n- Khiếu nại tới cơ quan có thẩm quyền nếu quyền lợi bị xâm phạm.\n\n',
          ),
          TextSpan(
            text: '8. Cookie và công nghệ tương tự\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Dùng để ghi nhớ phiên đăng nhập, cải thiện trải nghiệm, phân tích sử dụng. Bạn có thể cấu hình trong trình duyệt/thiết bị.\n\n',
          ),
          TextSpan(
            text: '9. Chuyển dữ liệu ra nước ngoài\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Nếu có, sẽ tuân thủ quy định pháp luật và đảm bảo mức độ bảo vệ tương đương.\n\n',
          ),
          TextSpan(
            text: '10. Dữ liệu của trẻ vị thành niên\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Không chủ đích thu thập dữ liệu dưới 16 tuổi nếu không có sự đồng ý hợp lệ của người đại diện hợp pháp.\n\n',
          ),
          TextSpan(
            text: '11. Cập nhật chính sách\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text:
                '- Chính sách có thể được cập nhật. Thông tin thay đổi sẽ được thông báo trên ứng dụng/bản tin.\n\n',
          ),
          TextSpan(
            text: '12. Liên hệ bảo mật\n',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          TextSpan(
            text: 'Email: privacy@chidibank.com | Hotline: 1900-xxxx.\n',
          ),
        ],
      ),
    );
  }
}
