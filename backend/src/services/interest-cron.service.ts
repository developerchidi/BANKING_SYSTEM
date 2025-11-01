import cron from 'node-cron';
import { InterestService } from '../services/interest.service';
import { EmailService } from './email.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InterestCronService {
  private static isRunning = false;

  /**
   * Khởi tạo cron job để tính lãi suất hàng tháng
   */
  static initializeCronJobs() {
    console.log('🕐 InterestCronService: Initializing cron jobs...');

    // Chạy vào ngày 1 hàng tháng lúc 2:00 AM
    cron.schedule('0 2 1 * *', async () => {
      console.log('📅 Monthly interest calculation triggered');
      await this.runMonthlyInterestCalculation();
    }, {
      timezone: 'Asia/Ho_Chi_Minh',
    });

    // Chạy test hàng ngày lúc 3:00 AM (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      cron.schedule('0 3 * * *', async () => {
        console.log('🧪 Daily interest calculation test triggered');
        await this.runMonthlyInterestCalculation();
      }, {
        timezone: 'Asia/Ho_Chi_Minh',
      });
    }

    console.log('✅ Interest cron jobs initialized');
  }

  /**
   * Chạy tính lãi suất hàng tháng
   */
  static async runMonthlyInterestCalculation() {
    if (this.isRunning) {
      console.log('⚠️ Interest calculation already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🏦 Starting monthly interest calculation...');

    try {
      // Tính lãi suất cho tất cả tài khoản
      const calculations = await InterestService.calculateMonthlyInterest();
      
      if (calculations.length === 0) {
        console.log('📊 No accounts eligible for interest calculation');
        return;
      }

      console.log(`📊 Processing ${calculations.length} interest calculations...`);

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Xử lý từng tài khoản
      for (const calculation of calculations) {
        try {
          // Tạo bản ghi lãi suất
          const interest = await prisma.interest.create({
            data: {
              userId: calculation.userId,
              accountId: calculation.accountId,
              interestType: calculation.interestType,
              interestRate: calculation.interestRate,
              principalAmount: calculation.principalAmount,
              interestAmount: calculation.interestAmount,
              totalAmount: calculation.totalAmount,
              calculationDate: new Date(),
              periodStart: calculation.periodStart,
              periodEnd: calculation.periodEnd,
              status: 'PENDING',
            },
          });

          // Tạo transaction cho lãi suất
          const transactionNumber = `INT${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const transaction = await prisma.transaction.create({
            data: {
              userId: calculation.userId,
              transactionNumber: transactionNumber,
              type: 'INTEREST',
              category: 'INTEREST',
              amount: calculation.interestAmount,
              description: `Lãi suất ${calculation.interestType} - ${calculation.interestRate}%/năm`,
              receiverAccountId: calculation.accountId,
              status: 'COMPLETED'
            }
          });

          // Cập nhật số dư tài khoản
          await prisma.account.update({
            where: { id: calculation.accountId },
            data: {
              balance: calculation.totalAmount,
              availableBalance: calculation.totalAmount,
            },
          });

          // Cập nhật trạng thái bản ghi lãi suất
          await prisma.interest.update({
            where: { id: interest.id },
            data: {
              status: 'POSTED',
              postedAt: new Date(),
              transactionId: transaction.id
            }
          });

          successCount++;
          console.log(`✅ Interest posted for account ${calculation.accountId}: ${calculation.interestAmount} VND`);
          
          // Gửi thông báo cho user
          await this.sendInterestNotification(calculation);

        } catch (error) {
          failureCount++;
          const errorMsg = `Error processing account ${calculation.accountId}: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Tạo báo cáo tổng kết
      const report = {
        totalProcessed: calculations.length,
        successCount,
        failureCount,
        errors,
        totalInterestPaid: calculations.reduce((sum, calc) => sum + calc.interestAmount, 0),
        processedAt: new Date(),
      };

      console.log('📊 Interest calculation completed:', report);

      // Gửi báo cáo cho admin
      await this.sendAdminReport(report);

    } catch (error) {
      console.error('❌ Critical error in monthly interest calculation:', error);
      
      // Gửi thông báo lỗi cho admin
      await this.sendErrorNotification(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Gửi thông báo lãi suất cho user
   */
  private static async sendInterestNotification(calculation: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: calculation.userId },
        include: {
          accounts: {
            where: { id: calculation.accountId },
            select: { accountNumber: true, accountName: true },
          },
        },
      });

      if (!user) return;

      const account = user.accounts[0];
      if (!account) return;

      const month = calculation.periodEnd.getMonth() + 1;
      const year = calculation.periodEnd.getFullYear();

      // Gửi push notification qua WebSocket
      try {
        const fetch = require('node-fetch');
        const notificationPayload = {
          userId: calculation.userId,
          type: 'interest_added',
          payload: {
            amount: calculation.interestAmount,
            accountNumber: account.accountNumber,
            description: `Lãi suất ${calculation.interestType} - ${calculation.interestRate}%/năm`,
            transactionNumber: `INT${Date.now()}${Math.floor(Math.random() * 1000)}`,
            newBalance: calculation.totalAmount,
            timestamp: new Date().toISOString(),
          }
        };

        const response = await fetch('http://localhost:3001/api/internal/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer internal-script'
          },
          body: JSON.stringify(notificationPayload)
        });

        if (response.ok) {
          console.log(`📱 Push notification sent to user ${user.email}`);
        } else {
          console.log('⚠️ Failed to send push notification');
        }
      } catch (notificationError) {
        console.log('⚠️ Failed to send push notification:', notificationError instanceof Error ? notificationError.message : notificationError);
      }

      // Tạo nội dung email
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🏦 Chidi Bank</h1>
            <h2 style="margin: 10px 0 0 0;">Lãi suất tháng ${month}/${year}</h2>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="font-size: 16px; color: #333;">Xin chào <strong>${user.firstName} ${user.lastName}</strong>,</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h3 style="color: #28a745; margin-top: 0;">💰 Thông tin lãi suất</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tài khoản:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${account.accountNumber} - ${account.accountName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Số tiền lãi:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #28a745; font-weight: bold;">+${calculation.interestAmount.toLocaleString('vi-VN')} VND</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Lãi suất:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${calculation.interestRate}%/năm</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Kỳ tính lãi:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${calculation.periodStart.toLocaleDateString('vi-VN')} - ${calculation.periodEnd.toLocaleDateString('vi-VN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Số dư hiện tại:</strong></td>
                  <td style="padding: 8px 0; font-weight: bold;">${calculation.totalAmount.toLocaleString('vi-VN')} VND</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px;">Cảm ơn bạn đã tin tưởng Chidi Bank!</p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>Chidi Bank - Ngân hàng số hiện đại</p>
            <p>Email: support@chidibank.com | Hotline: 1900-xxxx</p>
          </div>
        </div>
      `;

      // Gửi email
      await EmailService.sendEmail(
        user.email,
        `🏦 Chidi Bank - Lãi suất tháng ${month}/${year}`,
        emailContent
      );

      console.log(`📧 Interest notification sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Error sending interest notification:', error);
    }
  }

  /**
   * Gửi báo cáo cho admin
   */
  private static async sendAdminReport(report: any) {
    try {
      const adminEmails = await prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['ADMIN', 'SUPER_ADMIN'] },
              },
            },
          },
        },
        select: { email: true },
      });

      if (adminEmails.length === 0) return;

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🏦 Chidi Bank</h1>
            <h2 style="margin: 10px 0 0 0;">Báo cáo tính lãi suất hàng tháng</h2>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0;">📊 Tổng kết</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tổng tài khoản xử lý:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${report.totalProcessed}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Thành công:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #28a745;">${report.successCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Thất bại:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #dc3545;">${report.failureCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Tổng lãi đã trả:</strong></td>
                  <td style="padding: 8px 0; font-weight: bold; color: #28a745;">${report.totalInterestPaid.toLocaleString('vi-VN')} VND</td>
                </tr>
              </table>
            </div>
            
            ${report.errors.length > 0 ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">⚠️ Lỗi:</h4>
                <ul style="color: #856404;">
                  ${report.errors.map((error: string) => `<li>${error}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p style="color: #666; font-size: 14px;">Thời gian xử lý: ${report.processedAt.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      `;

      // Gửi email cho tất cả admin (với error handling)
      let sentCount = 0;
      for (const admin of adminEmails) {
        try {
          // Bỏ qua email không hợp lệ hoặc không tồn tại
          if (!admin.email || !admin.email.includes('@')) {
            console.log(`⚠️ Skipping invalid admin email: ${admin.email}`);
            continue;
          }
          
          await EmailService.sendEmail(
            admin.email,
            '🏦 Chidi Bank - Báo cáo tính lãi suất hàng tháng',
            emailContent
          );
          sentCount++;
          console.log(`✅ Admin report sent to: ${admin.email}`);
        } catch (error) {
          console.error(`❌ Failed to send admin report to ${admin.email}:`, error instanceof Error ? error.message : error);
          // Tiếp tục gửi cho admin khác dù có lỗi
        }
      }

      console.log(`📧 Admin report sent to ${sentCount}/${adminEmails.length} admins`);
    } catch (error) {
      console.error('❌ Error sending admin report:', error);
    }
  }

  /**
   * Gửi thông báo lỗi cho admin
   */
  private static async sendErrorNotification(error: any) {
    try {
      const adminEmails = await prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: {
                name: { in: ['ADMIN', 'SUPER_ADMIN'] },
              },
            },
          },
        },
        select: { email: true },
      });

      if (adminEmails.length === 0) return;

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚨 Chidi Bank</h1>
            <h2 style="margin: 10px 0 0 0;">Lỗi tính lãi suất hàng tháng</h2>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Chi tiết lỗi:</h3>
              <p style="color: #856404; word-break: break-all;">${errorMessage}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
            <p style="color: #666; font-size: 14px;">Vui lòng kiểm tra và khắc phục sớm nhất có thể.</p>
          </div>
        </div>
      `;

      // Gửi email cho tất cả admin
      for (const admin of adminEmails) {
        await EmailService.sendEmail(
          admin.email,
          '🚨 Chidi Bank - Lỗi tính lãi suất hàng tháng',
          emailContent
        );
      }

      console.log(`📧 Error notification sent to ${adminEmails.length} admins`);
    } catch (emailError) {
      console.error('❌ Error sending error notification:', emailError);
    }
  }

  /**
   * Chạy tính lãi suất thủ công (cho testing)
   */
  static async runManualCalculation() {
    console.log('🔧 Running manual interest calculation...');
    await this.runMonthlyInterestCalculation();
  }
}
