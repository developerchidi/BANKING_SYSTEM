import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ open, onClose }) => {
  // TODO: Thêm xác nhận nhập email/mật khẩu nếu cần
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-4 text-red-600">Xóa tài khoản</h3>
        <p className="mb-6">Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.</p>
        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold">
            Hủy
          </Button>
          <Button onClick={onClose} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold">
            Xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAccountModal; 