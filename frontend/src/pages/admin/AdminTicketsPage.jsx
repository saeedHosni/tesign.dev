// src/pages/admin/AdminTicketsPage.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Pagination, Modal, Select, Toast, FormField, Spinner, Textarea,
} from './AdminUI';
import { adminApi } from '../../services/api';

// ─── نگاشت وضعیت ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  OPEN:     { label: 'باز',                color: 'yellow' },
  ANSWERED: { label: 'پاسخ داده شده',     color: 'blue'   },
  PENDING:  { label: 'در انتظار کاربر',   color: 'purple' },
  CLOSED:   { label: 'بسته شده',           color: 'gray'   },
};

const PRIORITY_MAP = {
  LOW:    { label: 'کم',    color: 'gray'   },
  MEDIUM: { label: 'متوسط', color: 'yellow' },
  HIGH:   { label: 'زیاد',  color: 'red'    },
};

const DEPT_MAP = {
  SUPPORT:   { label: 'پشتیبانی عمومی', icon: '🎧' },
  TECHNICAL: { label: 'بخش فنی',        icon: '⚙️' },
  SALES:     { label: 'بخش فروش',       icon: '💰' },
  ORDER:     { label: 'درباره سفارش',   icon: '📦' },
};

const toDate     = (d) => d ? new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const toDateTime = (d) => d ? new Date(d).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// فرمت‌های فایل مجاز برای پیوست پاسخ ادمین
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
];
const ALLOWED_EXT  = ['.jpg','.jpeg','.png','.webp','.gif','.svg','.pdf','.zip'];
const MAX_FILES    = 5;
const MAX_SIZE_MB  = 10;

// ─── کامپوننت پیام در thread ───────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAdmin    = msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPER_ADMIN';
  const isInternal = msg.isInternal;

  return (
    <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
        isAdmin
          ? 'bg-accent-yellow/15 border border-accent-yellow/30 text-accent-yellow'
          : 'bg-white/8 border border-border-default text-text-secondary'
      }`}>
        {isAdmin ? '👤' : '🙋'}
      </div>

      <div className={`flex-1 max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold text-text-primary">
            {isAdmin ? (msg.sender?.name || 'ادمین') : (msg.sender?.name || 'کاربر')}
          </span>
          {isInternal && (
            <span className="text-[0.65rem] bg-purple-400/10 border border-purple-400/25 text-purple-400 px-1.5 py-0.5 rounded-full">
              یادداشت داخلی
            </span>
          )}
          <span className="text-[0.7rem] text-text-muted">{toDateTime(msg.createdAt)}</span>
        </div>

        <div className={`px-4 py-3 rounded-2xl text-sm text-text-primary leading-relaxed ${
          isInternal
            ? 'bg-purple-400/8 border border-purple-400/20'
            : isAdmin
              ? 'bg-accent-yellow/8 border border-accent-yellow/20 rounded-tr-sm'
              : 'bg-bg-base border border-border-default rounded-tl-sm'
        }`}>
          {msg.body}
        </div>

        {msg.attachments?.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-1">
            {msg.attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent-yellow border border-accent-yellow/20 bg-accent-yellow/5 hover:bg-accent-yellow/10 px-2.5 py-1 rounded-lg transition-colors">
                📎 {a.originalName || a.filename}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── کامپوننت آپلود پیوست ─────────────────────────────────────────────────────
function AttachmentUploader({ attachments, onAdd, onRemove, uploading }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const list = Array.from(files);
    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) return;

    list.slice(0, remaining).forEach((file) => {
      // بررسی نوع فایل
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
        return; // فایل نامعتبر را نادیده می‌گیریم
      }
      // بررسی حجم
      if (file.size > MAX_SIZE_MB * 1024 * 1024) return;

      onAdd(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* فایل‌های انتخاب‌شده */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((item) => (
            <div key={item.uid}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${
                item.status === 'done'
                  ? 'bg-green-400/8 border-green-400/25 text-green-400'
                  : item.status === 'error'
                    ? 'bg-red-400/8 border-red-400/25 text-red-400'
                    : 'bg-white/5 border-border-default text-text-secondary'
              }`}>
              {item.status === 'uploading' && <Spinner size={3} />}
              {item.status === 'done'      && <span>✓</span>}
              {item.status === 'error'     && <span>✕</span>}
              <span className="max-w-[140px] truncate">{item.file.name}</span>
              {item.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => onRemove(item.uid)}
                  className="text-text-muted hover:text-red-400 transition-colors cursor-pointer ml-0.5"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* دکمه انتخاب فایل */}
      {attachments.length < MAX_FILES && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-border-default text-text-muted hover:text-text-secondary hover:border-accent-yellow/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            📎 پیوست ({attachments.length}/{MAX_FILES})
          </button>
          <span className="text-[0.65rem] text-text-muted">
            تصویر، PDF، ZIP — حداکثر {MAX_SIZE_MB}MB
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={[...ALLOWED_MIME, ...ALLOWED_EXT].join(',')}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}

// ─── مودال جزئیات و پاسخ تیکت ─────────────────────────────────────────────────
function TicketDetailModal({ ticketId, onClose, onUpdated }) {
  const [ticket,      setTicket]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [reply,       setReply]       = useState('');
  const [internal,    setInternal]    = useState(false);
  const [status,      setStatus]      = useState('');
  const [priority,    setPriority]    = useState('');
  const [toast,       setToast]       = useState(null);
  // پیوست‌ها: آرایه‌ای از { file, status: 'pending'|'uploading'|'done'|'error', result }
  const [attachments, setAttachments] = useState([]);
  const bottomRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTicket = useCallback(async () => {
    try {
      const res = await adminApi.getTicketById(ticketId);
      setTicket(res.data);
      setStatus(res.data.status);
      setPriority(res.data.priority);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { loadTicket(); }, [loadTicket]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  // ─── آپلود یک فایل جدید ────────────────────────────────────────────────────
  const handleAddFile = async (file) => {
    // از یک uid ثابت استفاده می‌کنیم تا race condition نداشته باشیم
    const uid = `${Date.now()}-${Math.random()}`;
    setAttachments(prev => [...prev, { uid, file, status: 'uploading', result: null }]);

    try {
      const res = await adminApi.uploadTicketFile(file);
      // بک‌اند { success, data: {...} } برمی‌گرداند — فقط data را نگه می‌داریم
      const result = res.data;
      setAttachments(prev =>
        prev.map(a => a.uid === uid ? { ...a, status: 'done', result } : a)
      );
    } catch (e) {
      setAttachments(prev =>
        prev.map(a => a.uid === uid ? { ...a, status: 'error' } : a)
      );
      showToast(`آپلود ${file.name} ناموفق بود`, 'error');
    }
  };

  const handleRemoveFile = (uid) => {
    setAttachments(prev => prev.filter(a => a.uid !== uid));
  };

  // ─── ارسال پاسخ ────────────────────────────────────────────────────────────
  const handleReply = async () => {
    if (!reply.trim()) return;

    // اگر هنوز آپلودی در جریان است، صبر می‌کنیم
    const stillUploading = attachments.some(a => a.status === 'uploading');
    if (stillUploading) {
      showToast('لطفاً منتظر اتمام آپلود فایل‌ها باشید.', 'error');
      return;
    }

    // فقط فایل‌هایی که با موفقیت آپلود شده‌اند را می‌فرستیم
    const doneAttachments = attachments
      .filter(a => a.status === 'done' && a.result)
      .map(a => ({
        filename:     a.result.filename,
        originalName: a.result.originalName,
        url:          a.result.url,
        mimetype:     a.result.mimetype,
        size:         a.result.size,
      }));

    setSending(true);
    try {
      await adminApi.addTicketMessage(ticketId, {
        body:        reply.trim(),
        isInternal:  internal,
        attachments: doneAttachments,
      });
      setReply('');
      setInternal(false);
      setAttachments([]);
      await loadTicket();
      onUpdated?.();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSending(false); }
  };

  // ─── ذخیره تغییرات وضعیت/اولویت ───────────────────────────────────────────
  const handleUpdate = async () => {
    if (status === ticket?.status && priority === ticket?.priority) return;
    setSaving(true);
    try {
      await adminApi.updateTicket(ticketId, {
        status:   status   !== ticket.status   ? status   : undefined,
        priority: priority !== ticket.priority ? priority : undefined,
      });
      showToast('تیکت بروزرسانی شد');
      await loadTicket();
      onUpdated?.();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const isClosed       = ticket?.status === 'CLOSED';
  const isDirty        = ticket && (status !== ticket.status || priority !== ticket.priority);
  const hasUploading   = attachments.some(a => a.status === 'uploading');
  const canSend        = reply.trim() && !sending && !hasUploading;

  return (
    <Modal title={`تیکت ${ticket?.ticketNumber || '…'}`} onClose={onClose} maxWidth="max-w-3xl">
      {loading && <LoadingState />}
      {!loading && ticket && (
        <div className="flex flex-col gap-5">

          {/* اطلاعات بالا */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-bg-base rounded-xl p-3">
              <p className="text-text-muted text-xs mb-1">کاربر</p>
              <p className="text-text-primary text-sm font-semibold">{ticket.user?.name || '—'}</p>
              <p className="text-text-muted text-xs mt-0.5" dir="ltr">{ticket.user?.email}</p>
            </div>
            <div className="bg-bg-base rounded-xl p-3">
              <p className="text-text-muted text-xs mb-1">دپارتمان</p>
              <p className="text-text-secondary text-sm">
                {DEPT_MAP[ticket.department]?.icon} {DEPT_MAP[ticket.department]?.label || ticket.department}
              </p>
            </div>
            <div className="bg-bg-base rounded-xl p-3">
              <p className="text-text-muted text-xs mb-1">تاریخ ثبت</p>
              <p className="text-text-secondary text-sm">{toDate(ticket.createdAt)}</p>
            </div>
            {ticket.assignedTo && (
              <div className="bg-bg-base rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">ادمین مسئول</p>
                <p className="text-text-secondary text-sm">{ticket.assignedTo?.name || '—'}</p>
              </div>
            )}
          </div>

          {/* موضوع */}
          <div className="bg-bg-base rounded-xl p-4">
            <p className="text-text-muted text-xs mb-1">موضوع</p>
            <p className="text-text-primary font-semibold">{ticket.subject}</p>
          </div>

          {/* مکالمه */}
          <div className="flex flex-col gap-4 max-h-72 overflow-y-auto p-1">
            {ticket.messages?.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* تغییر وضعیت / اولویت */}
          <div className="flex gap-3 items-end flex-wrap border-t border-border-default pt-4">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-text-muted block mb-1.5">وضعیت</label>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="OPEN">باز</option>
                <option value="ANSWERED">پاسخ داده شده</option>
                <option value="PENDING">در انتظار کاربر</option>
                <option value="CLOSED">بسته شده</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-text-muted block mb-1.5">اولویت</label>
              <Select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="LOW">کم</option>
                <option value="MEDIUM">متوسط</option>
                <option value="HIGH">زیاد</option>
              </Select>
            </div>
            {isDirty && (
              <button onClick={handleUpdate} disabled={saving}
                className="text-sm px-4 py-2.5 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow hover:bg-accent-yellow/15 transition-colors cursor-pointer disabled:opacity-50">
                {saving ? <Spinner size={4} /> : 'ذخیره تغییرات'}
              </button>
            )}
          </div>

          {/* فرم پاسخ */}
          {!isClosed && (
            <div className="flex flex-col gap-3 border-t border-border-default pt-4">
              <Textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="متن پاسخ را بنویسید…"
                rows={4}
              />

              {/* آپلود پیوست */}
              <AttachmentUploader
                attachments={attachments}
                onAdd={handleAddFile}
                onRemove={handleRemoveFile}
                uploading={hasUploading}
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={e => setInternal(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-400"
                  />
                  <span className="text-sm text-text-secondary">یادداشت داخلی (کاربر نمی‌بیند)</span>
                </label>

                <button
                  onClick={handleReply}
                  disabled={!canSend}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl grad-bg text-[#111] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending    ? <Spinner size={4} /> : null}
                  {hasUploading ? 'در حال آپلود…' : internal ? 'ثبت یادداشت' : 'ارسال پاسخ'}
                </button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="text-center text-sm text-text-muted py-2 border-t border-border-default pt-4">
              این تیکت بسته شده است.
            </div>
          )}
        </div>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </Modal>
  );
}

// ─── صفحه اصلی مدیریت تیکت‌ها ────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const [items,     setItems]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [stats,     setStats]     = useState(null);
  const [page,      setPage]      = useState(1);
  const [status,    setStatus]    = useState('');
  const [priority,  setPriority]  = useState('');
  const [search,    setSearch]    = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [openId,    setOpenId]    = useState(null);
  const [toast,     setToast]     = useState(null);
  const PER_PAGE = 20;

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStats = async () => {
    try {
      const res = await adminApi.getTicketStats();
      setStats(res.data);
    } catch { /* non-critical */ }
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getTickets({
        page,
        limit: PER_PAGE,
        status:   status   || undefined,
        priority: priority || undefined,
        search:   search   || undefined,
      });
      setItems(res.data || []);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, status, priority, search]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { load(); }, [load]);

  const handleSearch   = (e) => { e.preventDefault(); setSearch(searchVal); setPage(1); };
  const filterChange   = (setter) => (val) => { setter(val); setPage(1); };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="تیکت‌های پشتیبانی"
        description={total ? `${total.toLocaleString('fa-IR')} تیکت` : ''}
      />

      {/* آمار سریع */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'باز',               value: stats.byStatus?.OPEN     ?? 0, color: 'text-accent-yellow' },
            { label: 'پاسخ داده شده',    value: stats.byStatus?.ANSWERED ?? 0, color: 'text-blue-400'    },
            { label: 'در انتظار کاربر',  value: stats.byStatus?.PENDING  ?? 0, color: 'text-purple-400'  },
            { label: 'بی‌پاسخ > ۲۴h',   value: stats.unansweredOver24h  ?? 0, color: 'text-red-400'     },
          ].map(s => (
            <div key={s.label} className="bg-bg-surface border border-border-default rounded-xl p-4">
              <p className="text-text-muted text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('fa-IR')}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        {/* فیلترها */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* جستجو */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="جستجو در موضوع، شماره، کاربر…"
              className="flex-1 px-3 py-2 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-yellow/50 transition-colors"
            />
            <button type="submit"
              className="px-4 py-2 rounded-xl bg-accent-yellow/10 border border-accent-yellow/25 text-accent-yellow text-sm cursor-pointer hover:bg-accent-yellow/15 transition-colors">
              جستجو
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchVal(''); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-border-default text-text-muted text-sm cursor-pointer hover:text-text-primary transition-colors">
                ✕
              </button>
            )}
          </form>

          {/* فیلتر وضعیت */}
          <div className="flex gap-1.5 flex-wrap">
            {[['', 'همه'], ['OPEN', 'باز'], ['ANSWERED', 'پاسخ داده شده'], ['PENDING', 'در انتظار'], ['CLOSED', 'بسته']].map(([v, l]) => (
              <button key={v} onClick={() => filterChange(setStatus)(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  status === v
                    ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30'
                    : 'text-text-muted border-border-default hover:text-text-primary'
                }`}>
                {l}
              </button>
            ))}
          </div>

          {/* فیلتر اولویت */}
          <div className="flex gap-1.5">
            {[['', 'هر اولویت'], ['HIGH', 'زیاد 🔴'], ['MEDIUM', 'متوسط'], ['LOW', 'کم']].map(([v, l]) => (
              <button key={v} onClick={() => filterChange(setPriority)(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  priority === v
                    ? 'bg-white/10 text-text-primary border-white/20'
                    : 'text-text-muted border-border-default hover:text-text-primary'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState icon="🎫" title="تیکتی یافت نشد" description="با تغییر فیلترها دوباره امتحان کنید" />
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <Table columns={[
              { label: 'شماره' },
              { label: 'کاربر' },
              { label: 'موضوع' },
              { label: 'دپارتمان' },
              { label: 'وضعیت' },
              { label: 'اولویت' },
              { label: 'تاریخ' },
              { label: 'عملیات', className: 'text-center' },
            ]}>
              {items.map(t => {
                const sm = STATUS_MAP[t.status]     || STATUS_MAP.OPEN;
                const pm = PRIORITY_MAP[t.priority] || PRIORITY_MAP.MEDIUM;
                const dm = DEPT_MAP[t.department]   || { label: t.department, icon: '🎫' };

                return (
                  <Tr key={t.id}>
                    <Td><span className="font-mono text-xs text-text-muted">{t.ticketNumber}</span></Td>
                    <Td>
                      <div>
                        <p className="text-text-primary text-sm font-medium">{t.user?.name || '—'}</p>
                        <p className="text-text-muted text-xs" dir="ltr">{t.user?.email}</p>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-text-secondary text-sm max-w-[220px] truncate">{t.subject}</p>
                      {t.messages?.length > 0 && (
                        <p className="text-text-muted text-xs mt-0.5">{t.messages.length} پیام</p>
                      )}
                    </Td>
                    <Td><span className="text-text-secondary text-sm">{dm.icon} {dm.label}</span></Td>
                    <Td><Badge color={sm.color}>{sm.label}</Badge></Td>
                    <Td><Badge color={pm.color}>{pm.label}</Badge></Td>
                    <Td><span className="text-text-muted text-xs">{toDate(t.createdAt)}</span></Td>
                    <Td className="text-center">
                      <button
                        onClick={() => setOpenId(t.id)}
                        className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/12 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        مشاهده / پاسخ
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
            <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onChange={setPage} />
          </>
        )}
      </Card>

      {openId && (
        <TicketDetailModal
          ticketId={openId}
          onClose={() => setOpenId(null)}
          onUpdated={() => { load(); loadStats(); }}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}