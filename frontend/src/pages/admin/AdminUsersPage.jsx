// src/pages/admin/AdminUsersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Pagination, Modal, FormField, Input, Select, Toast, Spinner,
} from './AdminUI';
import { adminApi } from '../../services/api';

const ROLE_MAP = {
  CUSTOMER:    { label: 'مشتری',    color: 'gray'   },
  ADMIN:       { label: 'مدیر',     color: 'yellow' },
  SUPER_ADMIN: { label: 'مدیر ارشد', color: 'orange' },
};

const toDate = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '—';

function EditUserModal({ user, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name:     user.name     || '',
    phone:    user.phone    || '',
    role:     user.role     || 'CUSTOMER',
    isActive: user.isActive !== false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal title={`ویرایش: ${user.name}`} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <FormField label="نام">
          <Input value={form.name} onChange={e => set('name', e.target.value)} />
        </FormField>
        <FormField label="شماره موبایل">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} dir="ltr" placeholder="09123456789" />
        </FormField>
        <FormField label="نقش">
          <Select value={form.role} onChange={e => set('role', e.target.value)}>
            {Object.entries(ROLE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </FormField>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
            className="accent-[#F5C518] w-4 h-4 cursor-pointer" />
          حساب فعال
        </label>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">
            انصراف
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
            {saving && <Spinner size={4} />} ذخیره
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateAdminModal({ onSave, onClose, saving }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.name || !form.email || !form.password) { alert('همه فیلدها الزامی است'); return; }
    onSave(form);
  };

  return (
    <Modal title="ایجاد ادمین جدید" onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <FormField label="نام" required>
          <Input value={form.name} onChange={e => set('name', e.target.value)} />
        </FormField>
        <FormField label="ایمیل" required>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} dir="ltr" />
        </FormField>
        <FormField label="رمز عبور" required>
          <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} dir="ltr" />
        </FormField>
        <FormField label="نقش">
          <Select value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="ADMIN">مدیر</option>
            <option value="SUPER_ADMIN">مدیر ارشد</option>
          </Select>
        </FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-border-default">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">
            انصراف
          </button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
            {saving && <Spinner size={4} />} ایجاد ادمین
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [editUser,    setEditUser]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);

  const PER_PAGE = 15;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getUsers({ page, limit: PER_PAGE, search: search || undefined, role: role || undefined });
      setUsers(res.data || res.users || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const handleEditSave = async (data) => {
    setSaving(true);
    try {
      await adminApi.updateUser(editUser.id, data);
      showToast('کاربر بروزرسانی شد');
      setEditUser(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSave = async (data) => {
    setSaving(true);
    try {
      await adminApi.createAdmin(data);
      showToast('ادمین ایجاد شد');
      setShowCreate(false);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="کاربران"
        description={`${total.toLocaleString('fa-IR')} کاربر`}
        actions={
          <button onClick={() => setShowCreate(true)}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity">
            + ادمین جدید
          </button>
        }
      />

      <Card>
        {/* Filters */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="جستجو با نام یا ایمیل…"
            className="w-full sm:w-72 px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
          />
          <Select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="w-auto !w-36"
          >
            <option value="">همه نقش‌ها</option>
            {Object.entries(ROLE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </div>

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && users.length === 0 && (
          <EmptyState icon="👥" title="کاربری یافت نشد" />
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <Table columns={[
              { label: 'کاربر' },
              { label: 'نقش' },
              { label: 'تعداد سفارش' },
              { label: 'تاریخ عضویت' },
              { label: 'وضعیت' },
              { label: 'عملیات', className: 'text-center' },
            ]}>
              {users.map(u => {
                const r = ROLE_MAP[u.role] || { label: u.role, color: 'gray' };
                return (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-yellow/15 border border-accent-yellow/25 grid place-items-center text-sm font-bold text-accent-yellow flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-medium">{u.name}</p>
                          <p className="text-text-muted text-xs" dir="ltr">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge color={r.color}>{r.label}</Badge></Td>
                    <Td><span className="text-text-secondary text-sm">{(u._count?.orders ?? u.orderCount ?? '—').toLocaleString?.('fa-IR') ?? '—'}</span></Td>
                    <Td><span className="text-text-secondary text-xs">{toDate(u.createdAt)}</span></Td>
                    <Td><Badge color={u.isActive !== false ? 'green' : 'red'}>{u.isActive !== false ? 'فعال' : 'غیرفعال'}</Badge></Td>
                    <Td className="text-center">
                      <button
                        onClick={() => setEditUser(u)}
                        className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ویرایش
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      {editUser && (
        <EditUserModal user={editUser} onSave={handleEditSave} onClose={() => setEditUser(null)} saving={saving} />
      )}
      {showCreate && (
        <CreateAdminModal onSave={handleCreateSave} onClose={() => setShowCreate(false)} saving={saving} />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}
