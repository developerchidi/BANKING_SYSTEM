import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      role="region"
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default React.memo(Card); 