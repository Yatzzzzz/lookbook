import { useState } from 'react';

type ToastType = {
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
};

type ToastState = ToastType & {
  id: string;
  visible: boolean;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = (props: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastState = {
      ...props,
      id,
      visible: true,
      type: props.type || 'default',
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);

    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );

    // Remove from state after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return { toast, dismiss, toasts };
} 