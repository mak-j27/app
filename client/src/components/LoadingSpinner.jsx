import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#007bff' }) => {
  const spinnerSize = {
    small: '1rem',
    medium: '2rem',
    large: '3rem'
  }[size];

  return (
    <div
      style={{
        display: 'inline-block',
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
      role="status"
      aria-label="loading"
    >
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
