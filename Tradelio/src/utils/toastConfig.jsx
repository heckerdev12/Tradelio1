// ===== toastConfig.jsx =====
import { toast } from 'sonner';
import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

// Add this custom CSS to your global styles or index.css
const customToastStyles = `
  [data-sonner-toast] [data-description] {
    color: #ffffff !important;
    opacity: 1 !important;
  }
  [data-sonner-toast] [data-title] {
    color: #ffffff !important;
  }
`;

export const showToast = {
  success: (message, description) => {
    toast.success(message, {
      description,
      duration: 3000,
      icon: React.createElement(CheckCircle, { 
        size: 20, 
        className: 'text-green-500'
      }),
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white font-normal',
      },
    });
  },

  error: (message, description) => {
    toast.error(message, {
      description,
      duration: 4000,
      icon: React.createElement(XCircle, { 
        size: 20, 
        className: 'text-red-500'
      }),
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white font-normal',
      },
    });
  },

  info: (message, description) => {
    toast.info(message, {
      description,
      duration: 3000,
      icon: React.createElement(Info, { 
        size: 20, 
        className: 'text-blue-500'
      }),
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white font-normal',
      },
    });
  },

  warning: (message, description) => {
    toast.warning(message, {
      description,
      duration: 3500,
      icon: React.createElement(AlertTriangle, { 
        size: 20, 
        className: 'text-yellow-500'
      }),
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white font-normal',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white font-normal',
      },
    });
  },

  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      classNames: {
        toast: 'bg-zinc-900 border border-zinc-800',
        title: 'text-white font-semibold',
        description: 'text-white',
      },
    });
  },
};

