import React, { useState } from 'react';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileInfoForm from '../components/profile/ProfileInfoForm';
import ChangePasswordAccordion from '../components/profile/ChangePasswordAccordion';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiShield, FiKey, FiAlertCircle, FiCamera } from 'react-icons/fi';

const tabs = [
  { label: 'Thông tin cá nhân', key: 'info', icon: <FiUser /> },
  { label: 'Bảo mật', key: 'security', icon: <FiShield /> },
  { label: 'Đổi mật khẩu', key: 'password', icon: <FiKey /> },
];

const ProfilePage: React.FC = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const { user } = useAuth();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${user?.firstName || ''}+${user?.lastName || ''}&background=0D8ABC&color=fff`;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-10 px-2 md:px-4">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-0 md:p-0 flex flex-col items-center">
        {/* Avatar lớn + upload */}
        <div className="flex flex-col items-center w-full pt-10 pb-4">
          <div className="relative w-32 h-32 mb-2 group">
            <img
              src={defaultAvatar}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
            />
            <button
              type="button"
              className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-3 cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white group-hover:scale-110 shadow"
              // onClick={...} // TODO: upload avatar
            >
              <FiCamera className="w-6 h-6" />
            </button>
          </div>
          <div className="text-2xl font-bold text-center mt-2">{user?.firstName} {user?.lastName}</div>
          <div className="text-gray-500 text-base mb-2 text-center">{user?.email}</div>
          {/* Badge bảo mật (giả lập) */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"><FiShield className="mr-1" /> Đã bật 2FA</span>
            {/* <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold"><FiAlertCircle className="mr-1" /> Chưa xác thực email</span> */}
          </div>
        </div>
        {/* Tabs ngang */}
        <div className="w-full flex justify-center border-b border-gray-200 bg-white">
          <div className="flex gap-2 w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-t-lg transition-all text-base focus:outline-none whitespace-nowrap border-b-2 ${activeTab === tab.key ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Nội dung tab */}
        <div className="w-full px-6 py-8 min-h-[320px] flex flex-col items-center">
          {activeTab === 'info' && <ProfileInfoForm />}
          {activeTab === 'security' && (
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-700"><FiShield /> Bảo mật tài khoản</h3>
                <ProfileSidebar onDeleteAccount={() => {}} only2FA />
              </div>
              <div className="text-gray-500 text-sm mt-2">
                Bật xác thực 2 lớp (2FA) để tăng cường bảo vệ tài khoản. Khi bật, mỗi lần đăng nhập hoặc giao dịch quan trọng, hệ thống sẽ yêu cầu mã OTP gửi về email hoặc số điện thoại của bạn.
              </div>
            </div>
          )}
          {activeTab === 'password' && <ChangePasswordAccordion alwaysOpen />}
        </div>
        {/* Nút xóa tài khoản nhỏ cuối card */}
        <div className="w-full flex justify-end px-6 pb-8">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors text-base"
          >
            <FiAlertCircle className="w-5 h-5" /> Xóa tài khoản
          </button>
        </div>
      </div>
      <DeleteAccountModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </div>
  );
};

export default ProfilePage; 