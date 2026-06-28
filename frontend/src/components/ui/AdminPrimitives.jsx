import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

export function AdminModuleHeader({ title, description, icon: Icon, action }) {
  return (
    <div className="admin-module-header">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="admin-module-icon">
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-primary">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}

export function AdminEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={20} />
        </div>
      )}
      <p className="text-sm font-semibold text-secondary">{title}</p>
      {description && <p className="empty-state-text mt-1 max-w-md">{description}</p>}
    </div>
  );
}

export function AdminSkeletonRows({ rows = 4, columns = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-4">
              <div className="skeleton-line" style={{ width: `${colIndex === 0 ? 72 : 48}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ActionDropdown({ label = 'Aksi', ariaLabel, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = 184;
    const padding = 12;
    const baseLeft = align === 'left' ? rect.left : rect.right - menuWidth;
    const left = Math.min(
      Math.max(padding, baseLeft),
      window.innerWidth - menuWidth - padding,
    );

    setMenuPosition({
      top: rect.bottom + 8,
      left,
    });
  }, [align]);

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);

    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, updateMenuPosition]);

  const visibleItems = items.filter(Boolean);

  if (visibleItems.length === 0) {
    return <span className="text-xs text-muted">Selesai</span>;
  }

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updateMenuPosition();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white/[.035] px-3 text-xs font-semibold text-secondary transition hover:border-white/15 hover:bg-white/[.06] hover:text-primary"
        aria-label={ariaLabel || label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={15} />
        {label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup menu aksi"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div
            role="menu"
            className="fixed z-[80] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-overlay)] p-1 shadow-elevated"
            style={{ top: menuPosition.top, left: menuPosition.left, width: 184 }}
          >
            {visibleItems.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }
                }}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${item.tone || 'text-secondary hover:bg-white/[.05] hover:text-primary'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
