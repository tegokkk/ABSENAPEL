import clsx from 'clsx';

export default function Table({ headers, children, className }) {
  return (
    <div className="table-wrap">
      <table className={clsx('data-table', className)}>
        {headers && (
          <colgroup>
            {headers.map((h, i) => (
              <col key={i} style={h.width ? { width: h.width } : undefined} />
            ))}
          </colgroup>
        )}
        {headers && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    h.align === 'right' && 'text-right',
                    h.align === 'center' && 'text-center',
                    h.className,
                  )}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, message = 'Belum ada data' }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="empty-state-text">{message}</p>
        </div>
      </td>
    </tr>
  );
}
