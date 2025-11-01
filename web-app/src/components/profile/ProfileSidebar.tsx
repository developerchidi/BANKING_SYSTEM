import React, { useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FiCamera, FiLoader, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';

interface ProfileSidebarProps {
  onDeleteAccount: () => void;
  hideDeleteButton?: boolean;
  only2FA?: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ onDeleteAccount, hideDeleteButton, only2FA }) => {
  const { user, loading: authLoading } = useAuth();
  // User không có trường avatar, nên tạo url avatar mặc định dựa trên tên
  const defaultAvatar = `https://ui-avatars.com/api/?name=${user?.firstName || ''}+${user?.lastName || ''}&background=0D8ABC&color=fff`;
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false); // TODO: lấy trạng thái thật từ user
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      // TODO: Gọi API upload avatar, demo delay
      await new Promise((res) => setTimeout(res, 1200));
      // const url = await uploadAvatarAPI(file);
      const url = URL.createObjectURL(file); // demo preview
      setAvatar(url);
    } catch (err) {
      setUploadError('Tải ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      // TODO: Gọi API bật/tắt 2FA
      await new Promise((res) => setTimeout(res, 1000));
      setTwoFAEnabled((v) => !v);
    } catch (err) {
      setTwoFAError('Thao tác thất bại.');
    } finally {
      setTwoFALoading(false);
    }
  };

  if (only2FA) {
    return (
      <div className="w-full flex flex-col items-center mb-2">
        <button
          onClick={handleToggle2FA}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${twoFAEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${twoFALoading ? 'opacity-60 pointer-events-none' : ''}`}
          disabled={twoFALoading}
        >
          <FiShield className="w-5 h-5" />
          {twoFAEnabled ? 'Đã bật bảo mật 2 lớp' : 'Bật bảo mật 2 lớp'}
          {twoFALoading && <FiLoader className="w-4 h-4 animate-spin" />}
          {twoFAEnabled && !twoFALoading && <FiCheckCircle className="w-4 h-4 text-green-500" />}
        </button>
        {twoFAError && <div className="text-red-500 text-xs flex items-center gap-1 mt-1"><FiAlertCircle /> {twoFAError}</div>}
        <span className="text-gray-400 italic text-xs mt-1">Bảo vệ tài khoản bằng xác thực 2 lớp (2FA)</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center space-y-6">
      {/* Avatar + upload */}
      <div className="relative w-28 h-28 mb-2 group">
        <img
          src={avatar}
          alt="Avatar"
          className="w-28 h-28 rounded-full object-cover border-2 border-blue-500 shadow"
        />
        <button
          type="button"
          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white group-hover:scale-110"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiCamera className="w-5 h-5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>
      {uploadError && <div className="text-red-500 text-xs flex items-center gap-1"><FiAlertCircle /> {uploadError}</div>}
      <div className="text-lg font-semibold text-center">{user?.firstName} {user?.lastName}</div>
      <div className="text-gray-500 text-sm mb-2 text-center">{user?.email}</div>
      {/* TwoFactorToggle */}
      <div className="w-full flex flex-col items-center mb-2">
        <button
          onClick={handleToggle2FA}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${twoFAEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${twoFALoading ? 'opacity-60 pointer-events-none' : ''}`}
          disabled={twoFALoading}
        >
          <FiShield className="w-5 h-5" />
          {twoFAEnabled ? 'Đã bật bảo mật 2 lớp' : 'Bật bảo mật 2 lớp'}
          {twoFALoading && <FiLoader className="w-4 h-4 animate-spin" />}
          {twoFAEnabled && !twoFALoading && <FiCheckCircle className="w-4 h-4 text-green-500" />}
        </button>
        {twoFAError && <div className="text-red-500 text-xs flex items-center gap-1 mt-1"><FiAlertCircle /> {twoFAError}</div>}
        <span className="text-gray-400 italic text-xs mt-1">Bảo vệ tài khoản bằng xác thực 2 lớp (2FA)</span>
      </div>
      {!hideDeleteButton && (
        <button
          onClick={onDeleteAccount}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiAlertCircle className="w-5 h-5" /> Xóa tài khoản
        </button>
      )}
    </div>
  );
};

export default ProfileSidebar; 