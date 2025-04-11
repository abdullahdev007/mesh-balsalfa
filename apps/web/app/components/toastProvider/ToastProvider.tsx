// components/ToastProvider.tsx

'use client';

import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          fontSize: "0.7rem",
          background: '#2D3142', // $dark-color
          color: '#FFFFFF',      // $light-color
          border: '2px solid #EF8354', // $primary-color
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#EF8354', // $primary-color
            secondary: '#FFFFFF', // $light-color
          },
        },
        error: {
          iconTheme: {
            primary: '#EF8354', // $primary-color
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
};

export default ToastProvider;
