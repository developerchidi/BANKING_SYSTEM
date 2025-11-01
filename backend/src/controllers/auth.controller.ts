import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma, withTimeout } from '../config/database';
import { AuthService, RegisterUserData, LoginUserData } from '../services/auth.service';

export class AuthController {
  static async checkEmailExists(req: Request, res: Response) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email as string },
        select: { id: true },
      });

      return res.json({ 
        exists: user !== null,
        message: user ? 'Email already exists' : 'Email is available'
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to check email', error: error instanceof Error ? error.message : error });
    }
  }

  static async checkPhoneExists(req: Request, res: Response) {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      const user = await prisma.user.findUnique({
        where: { phone: phone as string },
        select: { id: true },
      });

      return res.json({ 
        exists: user !== null,
        message: user ? 'Phone number already exists' : 'Phone number is available'
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to check phone', error: error instanceof Error ? error.message : error });
    }
  }

  static async checkStudentIdExists(req: Request, res: Response) {
    try {
      const { studentId } = req.query;
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      const userProfile = await prisma.userProfile.findUnique({
        where: { studentId: studentId as string },
        select: { id: true },
      });

      return res.json({ 
        exists: userProfile !== null,
        message: userProfile ? 'Student ID already exists' : 'Student ID is available'
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to check student ID', error: error instanceof Error ? error.message : error });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const passwordValidation = AuthService.validatePasswordStrength(req.body.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ errors: passwordValidation.errors });
      }

      const userData: RegisterUserData = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        studentId: req.body.studentId,
        cohort: req.body.cohort,
        school: req.body.school,
        termsAccepted: req.body.termsAccepted,
        termsVersion: req.body.termsVersion || '1.0',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        
        // Personal Information
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        nationality: req.body.nationality,
        
        // Address Information
        currentAddress: req.body.currentAddress,
        permanentAddress: req.body.permanentAddress,
        emergencyContact: req.body.emergencyContact,
        emergencyPhone: req.body.emergencyPhone,
      };

      const result = await AuthService.registerUser(userData);

      const enable2FAForNewUsers = false;
      if (enable2FAForNewUsers) {
        await prisma.user.update({ where: { id: result.userId }, data: { twoFactorEnabled: true } });
        return res.status(201).json({
          message: 'User registered successfully. 2FA verification required.',
          user: {
            id: result.userId,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            isEmailVerified: result.isEmailVerified,
            isKycVerified: result.isKycVerified,
            kycStatus: result.kycStatus,
            isActive: result.isActive,
            createdAt: result.createdAt,
          },
          requiresTwoFactor: true,
        });
      }

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: result.userId,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          isEmailVerified: result.isEmailVerified,
          isKycVerified: result.isKycVerified,
          kycStatus: result.kycStatus,
          isActive: result.isActive,
          createdAt: result.createdAt,
        },
        requiresTwoFactor: false,
      });
    } catch (error: any) {
      const code = error?.code;
      const target = Array.isArray(error?.meta?.target) ? error.meta.target : [];
      if (code === 'P2002') {
        if (target.includes('email')) {
          return res.status(409).json({ message: 'Email đã được sử dụng' });
        }
        if (target.includes('phone')) {
          return res.status(409).json({ message: 'Số điện thoại đã được sử dụng' });
        }
        return res.status(409).json({ message: 'Dữ liệu trùng lặp' });
      }
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Registration failed' });
    }
  }

  static async adminLogin(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const loginData: LoginUserData = {
        studentId: req.body.studentId,
        password: req.body.password,
      };

      const result = await AuthService.loginUser(loginData, req.ip);
      
      // Check if user has admin roles
      const userWithRoles = await prisma.user.findUnique({
        where: { id: result.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userRoles: {
            where: { isActive: true },
            include: { 
              role: { 
                select: { 
                  name: true, 
                  displayName: true, 
                  level: true 
                } 
              } 
            },
          },
        },
      });

      if (!userWithRoles) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user has admin roles (level >= 50)
      const hasAdminRole = userWithRoles.userRoles.some(
        userRole => userRole.role.level >= 50
      );

      if (!hasAdminRole) {
        return res.status(401).json({ 
          message: 'Tài khoản hoặc mật khẩu không đúng' 
        });
      }

      return res.json({
        success: true,
        message: 'Admin login successful',
        user: result.user,
        accessToken: result.tokens?.accessToken,
        refreshToken: result.tokens?.refreshToken,
        requiresTwoFactor: result.requiresTwoFactor,
        temporaryToken: result.temporaryToken,
      });
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : 'Admin login failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const loginData: LoginUserData = {
        studentId: req.body.studentId,
        password: req.body.password,
      };

      const result = await AuthService.loginUser(loginData, req.ip);
      return res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        accessToken: result.tokens?.accessToken,
        refreshToken: result.tokens?.refreshToken,
        requiresTwoFactor: result.requiresTwoFactor,
        temporaryToken: result.temporaryToken,
      });
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : 'Login failed' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];
      const refreshToken = req.body.refreshToken;
      if (!accessToken || !refreshToken) {
        return res.status(400).json({ message: 'Both access and refresh tokens are required' });
      }
      await AuthService.logoutUser(req.user!.userId, accessToken);
      return res.json({ message: 'Logout successful' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Logout failed' });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }
      const result = await AuthService.refreshToken(refreshToken);
      return res.json(result);
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : 'Token refresh failed' });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const user = await withTimeout(
        prisma.user.findUnique({
          where: { id: req.user.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isEmailVerified: true,
            isKycVerified: true,
            kycStatus: true,
            twoFactorEnabled: true,
            isActive: true,
            isLocked: true,
            lockedUntil: true,
            createdAt: true,
            dateOfBirth: true,
            accountTier: true,
            monthlyIncome: true,
            userProfile: {
              select: {
                id: true,
                studentId: true,
                cohort: true,
                school: true
              }
            },
            userRoles: {
              where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
              include: { role: { select: { name: true, displayName: true, level: true } } },
            },
          },
        }),
        15000 // 15 second timeout for complex query
      ).catch((error) => {
        console.error('Auth controller user query error:', error);
        throw new Error('Database query failed');
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check user status
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(401).json({ message: 'Account is locked' });
      }
      return res.json({ success: true, data: user });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to get user profile' });
    }
  }

  static async validatePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      const validation = AuthService.validatePasswordStrength(password);
      return res.json(validation);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Password validation failed' });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { currentPassword, newPassword } = req.body;
      const passwordValidation = AuthService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ errors: passwordValidation.errors });
      }
      await AuthService.changePassword(req.user.userId, currentPassword, newPassword);
      return res.json({ message: 'Password changed successfully' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to change password' });
    }
  }

  static async changeEmail(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { newEmail, password } = req.body;
      if (!newEmail || !password) {
        return res.status(400).json({ message: 'newEmail and password are required' });
      }
      await AuthService.changeEmail(req.user.userId, password, newEmail);
      return res.json({ message: 'Email updated. Verification code has been sent to your new email.' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to change email' });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      console.log(`📧 [AuthController] forgotPassword API called`);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error(`❌ [AuthController] Validation errors:`, errors.array());
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      console.log(`📧 [AuthController] Email from request: ${email}`);
      
      await AuthService.forgotPassword(email);
      console.log(`✅ [AuthController] forgotPassword completed successfully`);
      return res.json({ message: 'Nếu email tồn tại, mã xác nhận 6 số đã được gửi để đặt lại mật khẩu.' });
    } catch (error) {
      console.error(`❌ [AuthController] Error in forgotPassword:`, error);
      console.error(`❌ [AuthController] Error details:`, error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(`❌ [AuthController] Stack trace:`, error.stack);
      }
      // Still return success message for security (don't reveal if email exists)
      return res.json({ message: 'Nếu email tồn tại, mã xác nhận 6 số đã được gửi để đặt lại mật khẩu.' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { token, newPassword } = req.body;
      const passwordValidation = AuthService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ errors: passwordValidation.errors });
      }
      await AuthService.resetPassword(token, newPassword);
      return res.json({ message: 'Password reset successfully' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to reset password' });
    }
  }

  static async verifyResetCode(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: 'Mã xác nhận là bắt buộc' });
      await AuthService.verifyResetCode(token);
      return res.json({ message: 'Mã xác nhận hợp lệ' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Mã xác nhận không hợp lệ' });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { token } = req.body;
      await AuthService.verifyEmail(token);
      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to verify email' });
    }
  }

  static async resendVerification(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      await AuthService.resendEmailVerification(req.user.userId);
      return res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to send verification email' });
    }
  }

  static async completeTwoFactorLogin(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { userId, code } = req.body;
      if (!userId || !code) {
        return res.status(400).json({ message: 'User ID and 2FA code are required' });
      }
      const result = await AuthService.completeTwoFactorLogin(userId, code, req.ip);
      return res.json({ message: '2FA verification successful', user: result.user, tokens: result.tokens });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : '2FA verification failed' });
    }
  }
}

export default AuthController;

