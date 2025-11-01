import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { DatabaseService, BANKING_CONSTANTS } from './database.service';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index';
import { EmailService } from './email.service';
import { twoFactorService } from './two-factor.service';

const prismaClient = new PrismaClient();

// Types
export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  studentId: string; // Thêm studentId
  cohort?: string;   // Thêm cohort
  school?: string;   // Thêm school
  termsAccepted?: boolean; // Terms agreement
  termsVersion?: string;    // Terms version
  ipAddress?: string;       // IP address for audit
  userAgent?: string;       // User agent for audit
  
  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  
  // Address Information
  currentAddress?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface LoginUserData {
  studentId: string; // Thay đổi từ email sang studentId
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  kycStatus: string;
  isActive: boolean;
  createdAt: Date;
}

export interface RegisterResult {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  kycStatus: string;
  isActive: boolean;
  createdAt: Date;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  // Register new user
  static async registerUser(userData: RegisterUserData): Promise<RegisterResult> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Check if user exists by email
      const existingUserByEmail = await tx.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUserByEmail) {
        throw new Error('Email already registered');
      }

      // Check if studentId already exists
      const existingUserByStudentId = await tx.userProfile.findUnique({
        where: { studentId: userData.studentId },
      });

      if (existingUserByStudentId) {
        throw new Error('Student ID already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phoneNumber,
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
          gender: userData.gender,
          nationality: userData.nationality,
          displayCurrency: 'VND',
          isEmailVerified: false,
          isPhoneVerified: false,
          isKycVerified: false,
          kycStatus: 'PENDING',
          twoFactorEnabled: false,
          isActive: true,
          isLocked: false,
        },
      });

      // Create default checking account
      const account = await tx.account.create({
        data: {
          accountNumber: DatabaseService.generateAccountNumber(),
          accountType: BANKING_CONSTANTS.ACCOUNT_TYPES.CHECKING,
          accountName: DatabaseService.formatUserName(userData.firstName, userData.lastName),
          currency: 'VND',
          balance: 0,
          availableBalance: 0,
          isActive: true,
          isFrozen: false,
          userId: user.id,
        },
      });

      // Create user profile with student information
      await tx.userProfile.create({
        data: {
          userId: user.id,
          studentId: userData.studentId,
          cohort: userData.cohort,
          school: userData.school,
          currentAddress: userData.currentAddress,
          permanentAddress: userData.permanentAddress,
          emergencyContact: userData.emergencyContact,
          emergencyPhone: userData.emergencyPhone,
        },
      });

      // Create terms acceptance record if terms were accepted
      if (userData.termsAccepted) {
        await tx.termsAcceptance.create({
          data: {
            userId: user.id,
            termsVersion: userData.termsVersion || '1.0',
            termsType: 'REGISTRATION',
            acceptedAt: new Date(),
            ipAddress: userData.ipAddress,
            userAgent: userData.userAgent,
            acceptanceMethod: 'MOBILE',
          },
        });
      }

      // Create audit log asynchronously
      DatabaseService.createAuditLog({
        action: 'USER_REGISTERED',
        tableName: 'users',
        recordId: user.id,
        userId: user.id,
        newValues: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          termsAccepted: userData.termsAccepted,
          termsVersion: userData.termsVersion,
        },
      });

      // Generate tokens
      const tokens = this.generateTokens(user.id);

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isKycVerified: user.isKycVerified,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    });
  }

  // Login user
  static async loginUser(loginData: LoginUserData, ipAddress?: string): Promise<{ user: AuthUser; tokens: AuthTokens | null; requiresTwoFactor?: boolean; temporaryToken?: string }> {
    // Find user by studentId through UserProfile
    const userProfile = await prismaClient.userProfile.findUnique({
      where: { studentId: loginData.studentId },
      include: { user: true },
    });

    if (!userProfile || !userProfile.user) {
      throw new Error('Invalid student ID or password');
    }

    const user = userProfile.user;

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked. Please try again later');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      // Update user with failed login
      await prismaClient.user.update({
        where: { id: user.id },
        data: {
          isLocked: true,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Lock for 15 minutes
        },
      });

      throw new Error('Invalid student ID or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA
      const temporaryToken = this.generateTemporaryToken(user.id);
      
      // Generate and send 2FA code
      try {
        await twoFactorService.createCode(user.id, user.email);
        console.log(`✅ 2FA code sent to ${user.email}`);
      } catch (error) {
        console.error('Failed to send 2FA code:', error);
        // Continue with login flow even if 2FA code sending fails
      }
      
      // Return user info with temporary token - 2FA required
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isKycVerified: user.isKycVerified,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        tokens: null,
        requiresTwoFactor: true,
        temporaryToken: temporaryToken,
      };
    }

    // Reset lock status
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        isLocked: false,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || 'unknown',
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Create login session
    await this.createLoginSession(user.id, tokens.accessToken, ipAddress);

    // Create audit log asynchronously
    DatabaseService.createAuditLog({
      action: 'USER_LOGIN',
      tableName: 'users',
      recordId: user.id,
      userId: user.id,
      newValues: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || 'unknown',
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isKycVerified: user.isKycVerified,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  // Generate access and refresh tokens
  private static generateTokens(userId: string) {
    const accessTokenOptions: SignOptions = {
      expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    };

    const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, accessTokenOptions);
    const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, refreshTokenOptions);

    return { accessToken, refreshToken };
  }

  // Create login session
  private static async createLoginSession(userId: string, sessionToken: string, ipAddress?: string) {
    await prismaClient.loginSession.create({
      data: {
        userId,
        sessionToken,
        ipAddress: ipAddress || 'unknown',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<{ userId: string }> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await prismaClient.blacklistedToken.findUnique({
        where: { token },
      });

      if (isBlacklisted) {
        throw new Error('Token has been invalidated');
      }

      return jwt.verify(token, config.jwt.accessSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await prismaClient.blacklistedToken.findUnique({
        where: { token: refreshToken },
      });

      if (isBlacklisted) {
        throw new Error('Invalid refresh token');
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
      };

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId);

      // Blacklist old refresh token
      const refreshDecoded = jwt.decode(refreshToken) as { exp: number };
      await prismaClient.blacklistedToken.create({
        data: {
          token: refreshToken,
          expiresAt: new Date(refreshDecoded.exp * 1000),
        },
      });

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout user
  static async logoutUser(userId: string, accessToken: string) {
    try {
      // Verify token first to ensure it is valid
      const decoded = jwt.verify(accessToken, config.jwt.accessSecret) as { exp: number };

      // Add token to blacklist in database
      await prismaClient.blacklistedToken.create({
        data: {
          token: accessToken,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });

      return { message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  // Validate password strength
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in user table
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
        },
      });

      // Update password last changed in security info
      await tx.securityInfo.upsert({
        where: { userId },
        update: {
          passwordLastChanged: new Date(),
        },
        create: {
          userId,
          passwordLastChanged: new Date(),
        },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'PASSWORD_CHANGED',
        tableName: 'users',
        recordId: userId,
        userId,
        newValues: {
          passwordChangedAt: new Date(),
        },
      });
    });
  }

  // Change email and send verification code to new email
  static async changeEmail(userId: string, currentPassword: string, newEmail: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      const same = newEmail.toLowerCase() === user.email.toLowerCase();
      if (same) throw new Error('Email mới phải khác email hiện tại');

      const exists = await tx.user.findUnique({ where: { email: newEmail } });
      if (exists) throw new Error('Email đã được sử dụng');

      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) throw new Error('Mật khẩu không chính xác');

      // Update email and reset verification
      const updated = await tx.user.update({
        where: { id: userId },
        data: { email: newEmail, isEmailVerified: false },
      });

      // Create email verification code
      const code = this.generateSixDigitCode();
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await tx.emailVerification.create({
        data: { userId: updated.id, token: code, expiresAt: tokenExpiry },
      });
      await EmailService.sendEmailVerificationCode(newEmail, code);

      // Audit
      await DatabaseService.createAuditLog({
        action: 'EMAIL_CHANGED',
        tableName: 'users',
        recordId: userId,
        userId,
        newValues: { email: newEmail, isEmailVerified: false },
      });
    });
  }

  // Forgot password (send reset code)
  static async forgotPassword(email: string): Promise<void> {
    console.log(`📧 [AuthService] forgotPassword called for email: ${email}`);
    return await DatabaseService.executeTransaction(async (tx) => {
      // Find user by email
      console.log(`📧 [AuthService] Searching for user with email: ${email}`);
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        console.log(`📧 [AuthService] User not found for email: ${email} (returning silently for security)`);
        return;
      }

      console.log(`📧 [AuthService] User found: ${user.id}, email: ${user.email}`);

      // Generate 6-digit reset code
      const resetToken = this.generateSixDigitCode();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database
      await tx.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetTokenExpiry,
        },
      });

      // Send 6-digit code via email (real implementation)
      console.log(`📧 [AuthService] Sending password reset email to: ${user.email}`);
      try {
        await this.sendPasswordResetEmail(user.email, resetToken);
        console.log(`✅ [AuthService] Password reset email sent successfully`);
      } catch (error) {
        console.error(`❌ [AuthService] Failed to send password reset email:`, error);
        throw error; // Re-throw để caller biết
      }

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'PASSWORD_RESET_REQUESTED',
        tableName: 'users',
        recordId: user.id,
        userId: user.id,
        newValues: {
          resetTokenRequestedAt: new Date(),
        },
      });
    });
  }

  // Reset password with 6-digit code
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Validate code format: exactly 6 digits
      if (!token || !/^\d{6}$/.test(token)) {
        throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại mã.');
      }

      // Find reset token
      const resetRecord = await tx.passwordReset.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
          isUsed: false,
        },
        include: {
          user: true,
        },
      });

      if (!resetRecord) {
        throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại mã.');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedNewPassword,
        },
      });

      // Mark reset token as used
      const updatedResetRecord = await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      // Delete the reset token after use for security
      await tx.passwordReset.delete({
        where: { id: resetRecord.id },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'PASSWORD_RESET_COMPLETED',
        tableName: 'users',
        recordId: resetRecord.userId,
        userId: resetRecord.userId,
        newValues: {
          passwordUpdated: true,
        },
      });

    });
  }

  // Verify reset code without changing password
  static async verifyResetCode(token: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      if (!token || !/^\d{6}$/.test(token)) {
        throw new Error('Mã xác nhận không hợp lệ.');
      }
      const exists = await tx.passwordReset.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          isUsed: false,
        },
        select: { id: true },
      });
      if (!exists) {
        throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn.');
      }
    });
  }

  // Verify email with 6-digit code stored in token field
  static async verifyEmail(token: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      const verificationRecord = await tx.emailVerification.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          isUsed: false,
        },
      });

      if (!verificationRecord) {
        throw new Error('Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
      }

      await tx.user.update({
        where: { id: verificationRecord.userId },
        data: { isEmailVerified: true },
      });

      await tx.emailVerification.update({
        where: { id: verificationRecord.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'EMAIL_VERIFIED',
        tableName: 'users',
        recordId: verificationRecord.userId,
        userId: verificationRecord.userId,
        newValues: { isEmailVerified: true },
      });
    });
  }

  // Resend email verification
  static async resendEmailVerification(userId: string): Promise<void> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate 6-digit code instead of link
      const code = this.generateSixDigitCode();
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await tx.emailVerification.create({
        data: { userId: user.id, token: code, expiresAt: tokenExpiry },
      });

      // Send code email (no link)
      await EmailService.sendEmailVerificationCode(user.email, code);

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'EMAIL_VERIFICATION_RESENT',
        tableName: 'users',
        recordId: userId,
        userId,
        newValues: {
          verificationEmailSentAt: new Date(),
        },
      });
    });
  }

  // Generate reset code (6 digits)
  private static generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate verification token
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send password reset code email (real implementation)
  private static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    await EmailService.sendPasswordResetCodeEmail(email, token);
  }

  // Send email verification (real implementation)
  private static async sendEmailVerification(email: string, token: string): Promise<void> {
    await EmailService.sendEmailVerification(email, token);
  }

  // Complete 2FA login
  static async completeTwoFactorLogin(userId: string, code: string, ipAddress?: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Verify 2FA code
    const isValid = await twoFactorService.verifyCode(userId, code);
    if (!isValid) {
      throw new Error('Invalid or expired 2FA code');
    }

    // Get user
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Reset lock status
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        isLocked: false,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || 'unknown',
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Create login session
    await this.createLoginSession(user.id, tokens.accessToken, ipAddress);

    // Create audit log asynchronously
    DatabaseService.createAuditLog({
      action: 'USER_LOGIN_2FA',
      tableName: 'users',
      recordId: user.id,
      userId: user.id,
      newValues: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || 'unknown',
        twoFactorUsed: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isKycVerified: user.isKycVerified,
        kycStatus: user.kycStatus,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  // Generate temporary token for 2FA (short expiry, limited scope)
  private static generateTemporaryToken(userId: string): string {
    const payload = {
      userId,
      type: '2fa-temp',
      scope: ['2fa:send-code', '2fa:verify-code'],
    };

    const options: SignOptions = {
      expiresIn: '5m', // 5 minutes expiry
      issuer: 'banking-system',
      audience: '2fa-temp',
    };

    return jwt.sign(payload, this.JWT_SECRET, options);
  }
}

export default AuthService; 