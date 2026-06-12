// src/pages/admin/AdminMiscPages.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Pagination, Modal, Select, Toast, FormField, Spinner, Input, Textarea,
} from './AdminUI';
import { adminApi } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// AdminProjectsPage
// ─────────────────────────────────────────────────────────────────────────────

// وضعیت‌ها دقیقاً مطابق بک‌اند (ProjectLeadStatus در schema.prisma)
const STATUS_MAP = {
  NEW:         { label: 'جدید',             color: 'yellow' },
  CONTACTED:   { label: 'تماس گرفته شد',   color: 'blue'   },
  IN_PROGRESS: { label: 'در حال پیگیری',   color: 'purple' },
  CONVERTED:   { label: 'تبدیل به پروژه',  color: 'green'  },
  CLOSED:      { label: 'بسته شده',         color: 'gray'   },
};

const toDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '—';

function ProjectDetailModal({ project, onClose, onSave, saving }) {
  const [status, setStatus] = useState(project.status || 'NEW');
  const [notes,  setNotes]  = useState(project.notes  || '');

  const isDirty = status !== project.status || notes !== (project.notes || '');

  if (!project) return null;

  const baseUrl = (typeof window !== 'undefined' && import.meta?.env?.VITE_API_URL)
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

  return (
    <Modal title="جزئیات درخواست پروژه" onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-5">

        {/* ردیف اول: اطلاعات تماس */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-base rounded-xl p-3">
            <p className="text-text-muted text-xs mb-1">نام</p>
            <p className="text-text-primary text-sm font-medium">{project.name || '—'}</p>
          </div>
          <div className="bg-bg-base rounded-xl p-3">
            <p className="text-text-muted text-xs mb-1">تاریخ ثبت</p>
            <p className="text-text-primary text-sm">{toDate(project.createdAt)}</p>
          </div>
          {project.email && (
            <div className="bg-bg-base rounded-xl p-3">
              <p className="text-text-muted text-xs mb-1">ایمیل</p>
              <p className="text-accent-yellow text-sm" dir="ltr">
                <a href={`mailto:${project.email}`} className="hover:underline">{project.email}</a>
              </p>
            </div>
          )}
          {project.phone && (
            <div className="bg-bg-base rounded-xl p-3">
              <p className="text-text-muted text-xs mb-1">تلفن</p>
              <p className="text-accent-yellow text-sm" dir="ltr">
                <a href={`tel:${project.phone}`} className="hover:underline">{project.phone}</a>
              </p>
            </div>
          )}
        </div>

        {/* نوع پروژه + زیردسته‌ها */}
        {(project.projectType || (project.subcategories?.length > 0)) && (
          <div className="bg-bg-base rounded-xl p-4 flex flex-col gap-2">
            {project.projectType && (
              <div>
                <p className="text-text-muted text-xs mb-1">نوع پروژه</p>
                <p className="text-text-primary text-sm font-semibold">{project.projectType}</p>
              </div>
            )}
            {project.subcategories?.length > 0 && (
              <div>
                <p className="text-text-muted text-xs mb-2">زیردسته‌ها</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.subcategories.map((s, i) => (
                    <span key={i} className="text-xs bg-white/8 border border-border-default text-text-secondary rounded-full px-2.5 py-0.5">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* بودجه + زمانبندی */}
        {(project.budget || project.timeline) && (
          <div className="grid grid-cols-2 gap-3">
            {project.budget && (
              <div className="bg-bg-base rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">بودجه تقریبی</p>
                <p className="text-accent-yellow text-sm font-semibold">{project.budget}</p>
              </div>
            )}
            {project.timeline && (
              <div className="bg-bg-base rounded-xl p-3">
                <p className="text-text-muted text-xs mb-1">زمانبندی</p>
                <p className="text-text-primary text-sm">{project.timeline}</p>
              </div>
            )}
          </div>
        )}

        {/* توضیحات */}
        {project.description && (
          <div className="bg-bg-base rounded-xl p-4">
            <p className="text-text-muted text-xs mb-2">توضیحات پروژه</p>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>
        )}

        {/* فایل‌های پیوست */}
        {project.files?.length > 0 && (
          <div>
            <p className="text-text-muted text-xs mb-2">فایل‌های مرجع ({project.files.length})</p>
            <div className="flex flex-col gap-2">
              {project.files.map((f) => {
                const isImage = f.mimetype?.startsWith('image/');
                const fileUrl = f.url || `${baseUrl}/uploads/project-files/${f.filename}`;
                return (
                  <a
                    key={f.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-bg-base border border-border-default rounded-lg px-4 py-2.5 hover:border-accent-yellow/30 transition-colors no-underline"
                  >
                    <span className="text-base flex-shrink-0">{isImage ? '🖼️' : '📄'}</span>
                    <span className="text-text-secondary text-sm truncate flex-1">{f.originalName || f.filename}</span>
                    {f.size && (
                      <span className="text-text-muted text-xs flex-shrink-0">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                    <span className="text-accent-yellow text-xs flex-shrink-0">↓ دانلود</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* یادداشت ادمین */}
        <div>
          <FormField label="یادداشت داخلی" hint="فقط برای ادمین — کاربر نمی‌بیند">
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="پیگیری تلفنی، نتیجه جلسه، ..."
              rows={3}
            />
          </FormField>
        </div>

        {/* تغییر وضعیت */}
        <div className="flex items-center gap-3 pt-3 border-t border-border-default">
          <Select value={status} onChange={e => setStatus(e.target.value)} className="flex-1">
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <button
            onClick={() => onSave(project.id, { status, notes })}
            disabled={saving || !isDirty}
            className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {saving && <Spinner size={4} />}
            ذخیره تغییرات
          </button>
        </div>

      </div>
    </Modal>
  );
}

export function AdminProjectsPage() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('');
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const searchTimeout = useRef(null);
  const PER_PAGE = 15;

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getProjects({
        page,
        limit: PER_PAGE,
        status:  status || undefined,
        search:  search.trim() || undefined,
      });
      setItems(res.data || []);
      // بک‌اند pagination.total برمی‌گردونه
      setTotal(res.pagination?.total ?? res.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  // جستجوی debounce شده
  const handleSearchChange = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleSave = async (id, updates) => {
    setSaving(true);
    try {
      await adminApi.updateProject(id, updates);
      showToast('درخواست بروزرسانی شد');
      // داده local رو هم آپدیت کن تا modal بلافاصله تغییر رو نشون بده
      setSelected(prev => prev ? { ...prev, ...updates } : null);
      setItems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // باز کردن modal با دیتای کامل (شامل files)
  const handleOpen = async (project) => {
    // اول با دیتای لیست modal رو باز کن (سریع)
    setSelected(project);
    // بعد جزئیات کامل رو بگیر تا files هم نشون داده بشه
    if (!project.files) {
      try {
        const res = await adminApi.getProjectById(project.id);
        setSelected(res.data || res);
      } catch {
        // نادیده بگیر — دیتای لیست کافیه
      }
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="درخواست‌های پروژه"
        description={`${total.toLocaleString('fa-IR')} درخواست`}
      />

      <Card>
        {/* فیلترها + جستجو */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          {/* فیلتر وضعیت */}
          <div className="flex items-center gap-2 flex-wrap">
            {['', ...Object.keys(STATUS_MAP)].map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  status === s
                    ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30'
                    : 'text-text-muted border-border-default hover:text-text-primary hover:border-white/20'
                }`}
              >
                {s === '' ? 'همه' : STATUS_MAP[s].label}
              </button>
            ))}
          </div>

          {/* جستجو */}
          <div className="mr-auto">
            <input
              defaultValue={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="جستجو در نام، ایمیل، تلفن..."
              dir="rtl"
              className="w-64 px-4 py-1.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
            />
          </div>
        </div>

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState icon="📝" title="درخواستی یافت نشد" description="هنوز فرم ثبت پروژه‌ای ارسال نشده." />
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <Table columns={[
              { label: 'نام' },
              { label: 'تماس' },
              { label: 'نوع پروژه' },
              { label: 'بودجه' },
              { label: 'تاریخ' },
              { label: 'وضعیت' },
              { label: '', className: 'text-center' },
            ]}>
              {items.map(p => {
                const s = STATUS_MAP[p.status] || { label: p.status, color: 'gray' };
                return (
                  <Tr key={p.id}>
                    <Td>
                      <span className="text-text-primary text-sm font-medium">{p.name || '—'}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        {p.email && <span className="text-text-secondary text-xs" dir="ltr">{p.email}</span>}
                        {p.phone && <span className="text-text-muted text-xs" dir="ltr">{p.phone}</span>}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-text-secondary text-xs">{p.projectType || '—'}</span>
                        {p.subcategories?.length > 0 && (
                          <span className="text-text-muted text-[10px]">{p.subcategories.join(' · ')}</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-text-secondary text-xs">{p.budget || '—'}</span>
                    </Td>
                    <Td>
                      <span className="text-text-muted text-xs">{toDate(p.createdAt)}</span>
                    </Td>
                    <Td>
                      <Badge color={s.color}>{s.label}</Badge>
                    </Td>
                    <Td className="text-center">
                      <button
                        onClick={() => handleOpen(p)}
                        className="text-xs text-text-secondary border border-border-default hover:text-text-primary hover:border-white/20 px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-transparent"
                      >
                        جزئیات
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

      {selected && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminReviewsPage
// ─────────────────────────────────────────────────────────────────────────────

export function AdminReviewsPage() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [approved, setApproved] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const PER_PAGE = 15;

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getReviews({ page, limit: PER_PAGE, approved: approved || undefined });
      setItems(res.data || res.reviews || []);
      setTotal(res.pagination?.total ?? res.total ?? 0);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page, approved]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try { await adminApi.approveReview(id); showToast('نظر تأیید شد'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try { await adminApi.deleteReview(id); showToast('نظر حذف شد'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <AdminLayout>
      <AdminPageHeader title="نظرات" description={`${total.toLocaleString('fa-IR')} نظر`} />
      <Card>
        <div className="mb-5 flex items-center gap-2">
          {[['', 'همه'], ['false', 'در انتظار'], ['true', 'تأیید شده']].map(([v, l]) => (
            <button key={v} onClick={() => { setApproved(v); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${approved === v ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30' : 'text-text-muted border-border-default hover:text-text-primary'}`}>
              {l}
            </button>
          ))}
        </div>
        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && <EmptyState icon="⭐" title="نظری یافت نشد" />}
        {!loading && !error && items.length > 0 && (
          <>
            <Table columns={[{ label: 'کاربر' }, { label: 'محصول' }, { label: 'امتیاز' }, { label: 'نظر' }, { label: 'وضعیت' }, { label: '', className: 'text-center' }]}>
              {items.map(r => (
                <Tr key={r.id}>
                  <Td><span className="text-text-primary text-sm">{r.user?.name || '—'}</span></Td>
                  <Td><span className="text-text-secondary text-xs">{r.product?.name || '—'}</span></Td>
                  <Td><span className="text-accent-yellow text-sm">{'★'.repeat(r.rating || 0)}</span></Td>
                  <Td><span className="text-text-secondary text-xs line-clamp-2 max-w-[200px] block">{r.body || r.comment || '—'}</span></Td>
                  <Td><Badge color={r.isApproved ? 'green' : 'yellow'}>{r.isApproved ? 'تأیید شده' : 'در انتظار'}</Badge></Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!r.isApproved && (
                        <button onClick={() => handleApprove(r.id)}
                          className="text-xs text-green-400 border border-green-400/25 bg-green-400/5 hover:bg-green-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                          تأیید
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                        حذف
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onChange={setPage} />
          </>
        )}
      </Card>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminCouponsPage
// ─────────────────────────────────────────────────────────────────────────────

export function AdminCouponsPage() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const EMPTY = { code: '', type: 'PERCENT', value: '', minOrder: '', maxUses: '', expiresAt: '' };
  const [form, setForm] = useState(EMPTY);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getCoupons();
      setItems(res.data || res.coupons || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.value) { alert('کد و مقدار الزامی است'); return; }
    setSaving(true);
    try {
      await adminApi.createCoupon({
        code:           form.code.toUpperCase(),
        type:           form.type,
        value:          Number(form.value),
        minOrderAmount: form.minOrder  ? Number(form.minOrder) : null,
        usageLimit:     form.maxUses   ? Number(form.maxUses)  : null,
        expiresAt:      form.expiresAt || null,
      });
      showToast('کوپن ایجاد شد');
      setShowForm(false); setForm(EMPTY);
      load();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await adminApi.deleteCoupon(id); showToast('کوپن غیرفعال شد'); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setDeleting(null); }
  };

  const toDateLocal = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '—';

  return (
    <AdminLayout>
      <AdminPageHeader title="کدهای تخفیف" description={`${items.length} کوپن`}
        actions={
          <button onClick={() => setShowForm(true)}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity">
            + کوپن جدید
          </button>
        }
      />
      <Card>
        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && <EmptyState icon="🏷️" title="کوپنی وجود ندارد" />}
        {!loading && !error && items.length > 0 && (
          <Table columns={[{ label: 'کد' }, { label: 'نوع' }, { label: 'مقدار' }, { label: 'حداکثر استفاده' }, { label: 'انقضا' }, { label: 'وضعیت' }, { label: '', className: 'text-center' }]}>
            {items.map(c => (
              <Tr key={c.id}>
                <Td><span className="font-mono text-accent-yellow text-sm tracking-wider">{c.code}</span></Td>
                <Td><Badge color="blue">{c.type === 'PERCENT' ? 'درصدی' : 'مقداری'}</Badge></Td>
                <Td><span className="text-text-primary text-sm">{c.value}{c.type === 'PERCENT' ? '٪' : ' تومان'}</span></Td>
                <Td><span className="text-text-secondary text-sm">{c.maxUses ? c.maxUses.toLocaleString('fa-IR') : 'نامحدود'}</span></Td>
                <Td><span className="text-text-secondary text-xs">{toDateLocal(c.expiresAt)}</span></Td>
                <Td><Badge color={c.isActive ? 'green' : 'gray'}>{c.isActive ? 'فعال' : 'غیرفعال'}</Badge></Td>
                <Td className="text-center">
                  {c.isActive && (
                    <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                      className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                      {deleting === c.id ? '…' : 'غیرفعال'}
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && (
        <Modal title="کوپن جدید" onClose={() => { setShowForm(false); setForm(EMPTY); }} maxWidth="max-w-md">
          <div className="flex flex-col gap-4">
            <FormField label="کد تخفیف" required>
              <input value={form.code} onChange={e => setF('code', e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors font-mono tracking-wider"
                dir="ltr" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="نوع">
                <Select value={form.type} onChange={e => setF('type', e.target.value)}>
                  <option value="PERCENT">درصدی</option>
                  <option value="FIXED">مقداری (تومان)</option>
                </Select>
              </FormField>
              <FormField label={form.type === 'PERCENT' ? 'درصد تخفیف' : 'مبلغ تخفیف'} required>
                <input type="number" value={form.value} onChange={e => setF('value', e.target.value)}
                  placeholder={form.type === 'PERCENT' ? '20' : '50000'}
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
                  dir="ltr" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="حداکثر استفاده" hint="اختیاری">
                <input type="number" value={form.maxUses} onChange={e => setF('maxUses', e.target.value)}
                  placeholder="100" dir="ltr"
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors" />
              </FormField>
              <FormField label="تاریخ انقضا" hint="اختیاری">
                <input type="date" value={form.expiresAt} onChange={e => setF('expiresAt', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-yellow/60 transition-colors" />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-default">
              <button onClick={() => { setShowForm(false); setForm(EMPTY); }}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">
                انصراف
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
                {saving && <Spinner size={4} />} ایجاد کوپن
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}

export default AdminProjectsPage;