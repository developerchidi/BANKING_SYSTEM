import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { FiCheckCircle, FiAlertCircle, FiEdit2, FiLoader } from 'react-icons/fi';

const ProfileInfoForm: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '', // TODO: lấy từ user nếu có
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // TODO: Gọi API cập nhật thông tin user
      await new Promise((res) => setTimeout(res, 1200));
      setSuccess(true);
      setEditMode(false);
    } catch (err) {
      setError('Cập nhật thất bại.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Thông tin cá nhân</h3>
        {!editMode && (
          <Button onClick={() => setEditMode(true)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2 px-4 py-2">
            <FiEdit2 /> Chỉnh sửa
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Họ"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          disabled={!editMode}
        />
        <Input
          label="Tên"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          disabled={!editMode}
        />
        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled
        />
        <Input
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          disabled={!editMode}
        />
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        {editMode && (
          <>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white flex items-center gap-2 px-6 py-2">
              {loading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />} Lưu
            </Button>
            <Button onClick={() => setEditMode(false)} className="bg-gray-100 text-gray-700 flex items-center gap-2 px-6 py-2">
              Hủy
            </Button>
          </>
        )}
      </div>
      {success && (
        <div className="flex items-center gap-2 text-green-600 mt-4"><FiCheckCircle /> Cập nhật thành công!</div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-500 mt-4"><FiAlertCircle /> {error}</div>
      )}
    </Card>
  );
};

export default ProfileInfoForm; 