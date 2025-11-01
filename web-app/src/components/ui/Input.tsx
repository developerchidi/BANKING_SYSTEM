import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

const Input = React.memo(React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...rest }, ref) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      {...rest}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)));

Input.displayName = 'Input';

export default Input; 