// src/components/admin/AdminUI.jsx

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 5 }) {
  const px = { 4: '16px', 5: '20px', 6: '24px', 8: '32px' }[size] || '20px';
  return (
    <span
      style={{ width: px, height: px }}
      className="border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin inline-block"
    />
  );
}

export function LoadingState({ label = 'در حال بارگذاری…' }) {
  return (
    <div className="flex items-center justify-center gap-3 h-40 text-text-muted text-sm">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-10">
      <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 inline-block">
        {message || 'خطا در ارتباط با سرور'}
      </p>
      {onRetry && (
        <div className="mt-4">
          <button
            onClick={onRetry}
            className="text-sm font-medium text-accent-yellow border border-accent-yellow/30 rounded-lg px-4 py-2 bg-accent-yellow/5 hover:bg-accent-yellow/10 cursor-pointer transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-text-primary font-bold text-sm mb-1">{title}</p>
      {description && <p className="text-text-muted text-xs mb-5">{description}</p>}
      {action}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

export function StatCard({ icon, label, value, trend, accent = 'yellow', loading }) {
  const accentMap = {
    yellow: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
    orange: 'text-accent-orange bg-accent-orange/10 border-accent-orange/20',
    green:  'text-green-400 bg-green-400/10 border-green-400/20',
    blue:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    red:    'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`w-10 h-10 rounded-xl border grid place-items-center text-lg flex-shrink-0 ${accentMap[accent] || accentMap.yellow}`}>
          {icon}
        </span>
        {trend != null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            trend >= 0
              ? 'text-green-400 bg-green-400/10 border-green-400/20'
              : 'text-red-400 bg-red-400/10 border-red-400/20'
          }`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}٪
          </span>
        )}
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-20 rounded-md bg-white/5 animate-pulse" />
        ) : (
          <p className="text-2xl font-extrabold text-text-primary leading-tight">{value}</p>
        )}
        <p className="text-text-muted text-xs mt-1">{label}</p>
      </div>
    </Card>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ children, color = 'gray' }) {
  const map = {
    gray:   'text-text-muted bg-white/5 border-border-default',
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    green:  'text-green-400 bg-green-400/10 border-green-400/20',
    blue:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    red:    'text-red-400 bg-red-400/10 border-red-400/20',
    orange: 'text-accent-orange bg-accent-orange/10 border-accent-orange/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };
  return (
    <span className={`text-[0.72rem] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────

export function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-border-default">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-right text-xs font-bold text-text-muted uppercase tracking-wide px-6 py-3 whitespace-nowrap ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = '' }) {
  return (
    <tr className={`border-b border-border-default last:border-b-0 hover:bg-white/[0.02] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-6 py-3.5 align-middle ${className}`}>{children}</td>;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-yellow/30 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer transition-colors"
      >
        قبلی
      </button>
      <span className="text-sm text-text-muted px-2">
        صفحه {page} از {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-yellow/30 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer transition-colors"
      >
        بعدی
      </button>
    </div>
  );
}

// ── Form fields ───────────────────────────────────────────────────────────────

export function FormField({ label, hint, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.82rem] font-medium text-text-secondary">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[0.74rem] text-text-muted">{hint}</p>}
    </div>
  );
}

const inputBase = "w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors";

export function Input(props) {
  return <input {...props} className={`${inputBase} ${props.className || ''}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${inputBase} resize-y min-h-[100px] ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputBase} cursor-pointer ${props.className || ''}`}>
      {children}
    </select>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const styles = type === 'error'
    ? 'text-red-400 bg-red-400/10 border-red-400/20'
    : 'text-green-400 bg-green-400/10 border-green-400/20';
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-xl border text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center gap-3 animate-fade-in bg-bg-surface ${styles}`}>
      {type === 'error' ? '⚠️' : '✓'} {message}
      <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-base leading-none">×</button>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-bg-surface border border-border-default rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] animate-fade-in max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

export function ConfirmDialog({ title, description, confirmLabel = 'تأیید', danger, onConfirm, onCancel, loading }) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-text-secondary text-sm mb-6">{description}</p>
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors"
        >
          انصراف
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors flex items-center gap-2 ${
            danger
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25'
              : 'grad-bg text-[#111]'
          } disabled:opacity-60`}
        >
          {loading && <Spinner size={4} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}