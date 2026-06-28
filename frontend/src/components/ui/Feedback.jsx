import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="fixed right-3 top-20 z-[70] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2 sm:right-5"
      role="status"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`toast toast-${toast.type}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                {toast.title && <p className="text-sm font-bold leading-tight text-primary">{toast.title}</p>}
                {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-secondary">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ConfirmDialog({ dialog, onClose }) {
  return (
    <Modal open={!!dialog} onClose={() => onClose(false)} title={dialog?.title || 'Konfirmasi'} size="sm">
      <div className="space-y-4">
        {dialog?.description && (
          <p className="text-sm leading-relaxed text-secondary">{dialog.description}</p>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" onClick={() => onClose(false)}>
            {dialog?.cancelLabel || 'Batal'}
          </Button>
          <Button variant={dialog?.variant || 'danger'} onClick={() => onClose(true)}>
            {dialog?.confirmLabel || 'Lanjutkan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
