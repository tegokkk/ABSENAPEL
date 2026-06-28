import { useCallback, useState } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((toast) => {
    const id = crypto.randomUUID();
    const nextToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
    };

    setToasts((items) => [...items, nextToast].slice(-4));
    window.setTimeout(() => dismissToast(id), toast.duration || 3600);
    return id;
  }, [dismissToast]);

  return { toasts, notify, dismissToast };
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState(null);

  const requestConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Konfirmasi',
        description: options.description || '',
        confirmLabel: options.confirmLabel || 'Lanjutkan',
        cancelLabel: options.cancelLabel || 'Batal',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const closeConfirm = useCallback((result) => {
    setDialog((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  return { dialog, requestConfirm, closeConfirm };
}
