import React, { useState } from 'react';
import TransferFormContainer from '../banking/TransferFormContainer';
import Button from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExternalTransferModal: React.FC<Props> = ({ open, onClose }) => {
  const [hideClose, setHideClose] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">External Transfer</h2>
          {!hideClose && (
            <Button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-0 bg-transparent shadow-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
        <div className="p-6">
          <TransferFormContainer transferType="external" onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default ExternalTransferModal; 