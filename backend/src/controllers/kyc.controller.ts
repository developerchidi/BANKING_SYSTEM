import { Request, Response } from 'express';
import multer, { File } from 'multer';
import { KYCService } from '../services/kyc.service';

export class KycController {
  static uploadErrorHandler(err: any, req: any, res: any, next: any) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large', details: 'Maximum file size is 10MB' });
      }
      return res.status(400).json({ error: 'File upload failed', details: err.message });
    }
    next();
  }

  static async submit(req: any, res: any) {
    try {
      const { documentType, extractedData } = req.body;
      const files = req.files as { [fieldname: string]: File[] } | undefined;
      const userId = (req as any).user.id;

      const existingKYC = await KYCService.getKYCRequestsByUserId(userId);
      const pendingKYC = existingKYC.find((kyc) => kyc.status === 'PENDING');
      if (pendingKYC) {
        return res.status(400).json({
          success: false,
          error: 'Bạn đã có yêu cầu KYC đang chờ duyệt',
          existingKYC: {
            id: pendingKYC.id,
            status: pendingKYC.status,
            submittedAt: pendingKYC.submittedAt,
          },
        });
      }

      if (!documentType || !extractedData) {
        return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
      }

      if (documentType === 'STUDENT_CARD') {
        if (!files.frontImage || !files.selfieImage) {
          return res.status(400).json({ success: false, error: 'Vui lòng upload ảnh thẻ sinh viên và ảnh selfie' });
        }
      } else {
        if (!files.frontImage || !files.backImage || !files.selfieImage) {
          return res.status(400).json({ success: false, error: 'Vui lòng upload đầy đủ 3 ảnh' });
        }
      }

      const kycData = {
        userId,
        documentType,
        frontImage: files.frontImage[0].buffer.toString('base64'),
        backImage: files.backImage ? files.backImage[0]?.buffer.toString('base64') : undefined,
        selfieImage: files.selfieImage[0].buffer.toString('base64'),
        extractedData: JSON.parse(extractedData),
      };

      const kycRequest = await KYCService.createKYCRequest(kycData);
      return res.json({ success: true, message: 'KYC đã được gửi thành công', kycId: kycRequest.id, status: kycRequest.status });
    } catch (error: any) {
      if (error.message?.includes('Validation failed')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.status(500).json({ success: false, error: 'Lỗi hệ thống khi gửi KYC' });
    }
  }

  static async status(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const kycRequests = await KYCService.getKYCRequestsByUserId(userId);
      const latestKYC = kycRequests[0] || null;
      return res.json({
        success: true,
        status: (latestKYC as any)?.status || 'none',
        kycData: latestKYC
          ? {
              id: (latestKYC as any).id,
              status: (latestKYC as any).status,
              submittedAt: (latestKYC as any).submittedAt,
              reviewedAt: (latestKYC as any).reviewedAt,
              rejectionReason: (latestKYC as any).rejectionReason,
            }
          : null,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy trạng thái KYC' });
    }
  }

  static async all(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const result = await KYCService.getPendingKYCRequests(page, limit);
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách KYC' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const kycRequest = await KYCService.getKYCRequestById(id);
      if (!kycRequest) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu KYC' });
      }
      return res.json({ success: true, kycRequest });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy thông tin KYC' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const reviewedBy = (req as any).user.id;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
      }
      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập lý do từ chối' });
      }
      const kycRequest = await KYCService.updateKYCRequestStatus(id, { status, reviewedBy, rejectionReason });
      return res.json({
        success: true,
        message: `KYC đã được ${status === 'APPROVED' ? 'duyệt' : 'từ chối'}`,
        kycRequest: {
          id: (kycRequest as any).id,
          status: (kycRequest as any).status,
          reviewedAt: (kycRequest as any).reviewedAt,
          rejectionReason: (kycRequest as any).rejectionReason,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi cập nhật trạng thái KYC' });
    }
  }

  static async bulkUpdate(req: Request, res: Response) {
    try {
      const { ids, status, rejectionReason } = req.body;
      const reviewedBy = (req as any).user.id;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng chọn ít nhất một KYC' });
      }
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
      }
      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập lý do từ chối' });
      }
      const result = await KYCService.bulkUpdateKYCRequestStatuses(ids, status, reviewedBy, rejectionReason);
      return res.json({ success: true, message: `Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} ${result.count} KYC`, count: result.count });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi cập nhật hàng loạt KYC' });
    }
  }

  static async checkDuplicate(req: Request, res: Response) {
    try {
      const { idNumber } = req.body;
      if (!idNumber) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập số CCCD/CMND' });
      }
      const duplicateCheck = await KYCService.checkDuplicateIdNumber(idNumber);
      return res.json({ success: true, isDuplicate: duplicateCheck.isDuplicate, existingKYC: duplicateCheck.existingKYC });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi kiểm tra trùng lặp' });
    }
  }

  static async stats(req: Request, res: Response) {
    try {
      const stats = await KYCService.getKYCStatistics();
      return res.json({ success: true, stats });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê KYC' });
    }
  }
}

export default KycController;

