import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isTestMode: boolean;

  // Initialize email transporter
  static initialize() {
    // Check if email configuration is available
    this.isTestMode = !process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD;
    
    if (this.isTestMode) {
      console.log('📧 Email service running in TEST MODE (console output only)');
      console.log('📧 SMTP_MAIL:', process.env.SMTP_MAIL ? 'SET' : 'NOT SET');
      console.log('📧 SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
      return;
    }

    // Use Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    console.log('📧 Email service initialized with Gmail SMTP');
  }

  // Send password reset code email (no link, 6-digit code)
  static async sendPasswordResetCodeEmail(email: string, code: string): Promise<void> {
    console.log(`📧 [EmailService] sendPasswordResetCodeEmail called for: ${email}`);
    console.log(`📧 [EmailService] isTestMode: ${this.isTestMode}`);
    console.log(`📧 [EmailService] transporter exists: ${!!this.transporter}`);
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Banking System'}" <${process.env.FROM_EMAIL || process.env.SMTP_MAIL}>`,
      to: email,
      subject: 'Mã xác nhận đặt lại mật khẩu - Banking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Banking System</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Xin chào!</h2>
            <p style="color: #666; line-height: 1.6;">
              Đây là mã xác nhận để đặt lại mật khẩu của bạn. Vui lòng nhập mã bên dưới vào ứng dụng để tiếp tục.
            </p>
            <div style="display: inline-block; background: #fff; padding: 12px 24px; border-radius: 12px; border: 1px solid #e9ecef; font-size: 24px; letter-spacing: 6px; font-weight: 700; color: #333;">
              ${code}
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 16px;">
              Mã sẽ hết hạn sau 60 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Banking System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    if (this.isTestMode) {
      // Test mode: show email content in console
      console.log('\n📧 ===== PASSWORD RESET EMAIL (TEST MODE) =====');
      console.log(`📨 To: ${email}`);
      console.log(`📧 Subject: ${mailOptions.subject}`);
      console.log(`🔑 Reset Code: ${code}`);
      console.log('📧 ============================================\n');
      return;
    }

    if (!this.transporter) {
      console.error('❌ [EmailService] Transporter not initialized!');
      throw new Error('Email transporter not initialized');
    }

    try {
      console.log(`📧 [EmailService] Attempting to send email to: ${email}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset code sent successfully to ${email}`);
      console.log(`📧 [EmailService] Message ID: ${result.messageId}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      console.error('❌ [EmailService] Error details:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('❌ [EmailService] Stack trace:', error.stack);
      }
      // Fallback to console log
      console.log(`Password reset code sent to ${email} with code: ${code}`);
      throw error; // Re-throw để caller biết có lỗi
    }
  }

  // Send email verification
  static async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Banking System'}" <${process.env.FROM_EMAIL || process.env.SMTP_MAIL}>`,
      to: email,
      subject: 'Verify Your Email - Banking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Verification</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Banking System</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to Banking System!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering with Banking System. To complete your registration, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Verify Email
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Or copy and paste this link into your browser:
            </p>
            <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; color: #495057;">
              ${verificationLink}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                <strong>Important:</strong><br>
                • This link will expire in 24 hours<br>
                • This link can only be used once<br>
                • If you didn't create an account, please ignore this email
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Banking System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    if (this.isTestMode) {
      // Test mode: show email content in console
      console.log('\n📧 ===== EMAIL VERIFICATION (TEST MODE) =====');
      console.log(`📨 To: ${email}`);
      console.log(`📧 Subject: ${mailOptions.subject}`);
      console.log(`🔗 Verification Link: ${verificationLink}`);
      console.log(`🔑 Token: ${token}`);
      console.log('📧 ============================================\n');
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email verification sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send email verification:', error);
      // Fallback to console log
      console.log(`Verification email sent to ${email} with token: ${token}`);
      console.log(`Verification link: ${verificationLink}`);
    }
  }

  // Send 6-digit email verification code (no link)
  static async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Banking System'}" <${process.env.FROM_EMAIL || process.env.SMTP_MAIL}>`,
      to: email,
      subject: 'Mã xác thực email - Banking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Xác thực email</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Banking System</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Xin chào!</h2>
            <p style="color: #666; line-height: 1.6;">Đây là mã xác thực email của bạn. Vui lòng nhập mã bên dưới vào ứng dụng để hoàn tất xác thực.</p>
            <div style="display: inline-block; background: #fff; padding: 12px 24px; border-radius: 12px; border: 1px solid #e9ecef; font-size: 24px; letter-spacing: 6px; font-weight: 700; color: #333;">
              ${code}
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 16px;">Mã sẽ hết hạn sau 60 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Banking System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    if (this.isTestMode) {
      console.log('\n📧 ===== EMAIL VERIFY CODE (TEST MODE) =====');
      console.log(`📨 To: ${email}`);
      console.log(`📧 Subject: ${mailOptions.subject}`);
      console.log(`🔑 Verify Code: ${code}`);
      console.log('📧 =========================================\n');
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email verification code sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send email verification code:', error);
      console.log(`Email verification code to ${email}: ${code}`);
    }
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    if (this.isTestMode) {
      console.log('📧 Email service running in TEST MODE');
      return true;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }

  // Generic email sending method
  static async sendEmail(email: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Banking System'}" <${process.env.FROM_EMAIL || process.env.SMTP_MAIL}>`,
      to: email,
      subject,
      html,
    };

    if (this.isTestMode) {
      // Test mode: show email content in console
      console.log('\n📧 ===== GENERIC EMAIL (TEST MODE) =====');
      console.log(`📨 To: ${email}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 HTML Content: ${html.substring(0, 200)}...`);
      console.log('📧 ======================================\n');
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Fallback to console log
      console.log(`Email sent to ${email} with subject: ${subject}`);
    }
  }
} 