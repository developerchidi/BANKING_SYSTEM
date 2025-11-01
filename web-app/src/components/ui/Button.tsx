import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, className = '', ...rest }, ref) => (
  <button ref={ref} className={`px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none ${className}`} {...rest}>
    {children}
  </button>
)));

Button.displayName = 'Button';

export default Button; 