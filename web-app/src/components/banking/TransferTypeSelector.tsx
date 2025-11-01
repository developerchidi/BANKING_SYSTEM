import React from 'react';

interface TransferTypeSelectorProps {
  transferType: string;
  isTypeLocked: boolean;
  onTypeChange: (type: string) => void;
}

const TransferTypeSelector: React.FC<TransferTypeSelectorProps> = ({ 
  transferType, 
  isTypeLocked, 
  onTypeChange 
}) => {
  const transferTypes = [
    {
      type: 'internal',
      title: 'Internal Transfer',
      description: 'Between your accounts',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      type: 'external',
      title: 'External Transfer',
      description: 'To another user\'s account',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      type: 'beneficiary',
      title: 'Beneficiary',
      description: 'To saved beneficiaries',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  if (isTypeLocked) {
    const selectedType = transferTypes.find(t => t.type === transferType);
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Transfer Type</label>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            transferType === 'internal' ? 'bg-blue-500' :
            transferType === 'external' ? 'bg-orange-500' : 'bg-green-500'
          }`}>
            {selectedType?.icon}
          </div>
          <span className="font-semibold text-gray-900 text-lg capitalize">
            {selectedType?.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Transfer Type</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {transferTypes.map((type) => (
          <button
            key={type.type}
            onClick={() => onTypeChange(type.type)}
            className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
              transferType === type.type
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                transferType === type.type ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {type.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{type.title}</h3>
                <p className="text-gray-600">{type.description}</p>
                <p className="text-sm text-orange-600 font-medium">Small fee applies</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransferTypeSelector; 