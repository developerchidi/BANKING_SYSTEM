import React, { useState } from 'react';
import { ChangePasswordForm } from '../auth/ChangePasswordForm';

interface ChangePasswordAccordionProps {
  alwaysOpen?: boolean;
}

const ChangePasswordAccordion: React.FC<ChangePasswordAccordionProps> = ({ alwaysOpen }) => {
  const [open, setOpen] = useState(alwaysOpen || false);

  // Nếu alwaysOpen thì luôn mở, không cho toggle
  if (alwaysOpen) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">Đổi mật khẩu</h3>
        <div className="pt-2">
          <ChangePasswordForm />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <button
        className="w-full flex justify-between items-center font-bold text-lg mb-4 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        Đổi mật khẩu
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pt-2">
          <ChangePasswordForm />
        </div>
      )}
    </div>
  );
};

export default ChangePasswordAccordion; 