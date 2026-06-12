// src/pages/admin/AdminServicesPage.jsx
import { useState, useEffect } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Modal, FormField, Input, Textarea, Select, Toast, Spinner, ConfirmDialog,
} from './AdminUI';
import { adminApi, serviceApi } from '../../services/api';

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

const EMPTY_FORM = {
  title: '', slug: '', description: '', icon: '🌐',
  category: '', price: '', linkLabel: 'مشاوره رایگان', isActive: true,
  features: [{ title: '' }],
};

function ServiceForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addFeature    = () => set('features', [...form.features, { title: '' }]);
  const removeFeature = (i) => set('features', form.features.filter((_, idx) => idx !== i));
  const updateFeature = (i, v) => set('features', form.features.map((f, idx) => idx === i ? { ...f, title: v } : f));

  const submit = () => {
    if (!form.title.trim()) { alert('عنوان الزامی است'); return; }
    if (!form.slug.trim())  { alert('اسلاگ الزامی است'); return; }
    onSave({ ...form, features: form.features.filter(f => f.title.trim()) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="عنوان" required>
          <Input value={form.title} onChange={e => { set('title', e.target.value); if (!initial) set('slug', slugify(e.target.value)); }} />
        </FormField>
        <FormField label="اسلاگ" required>
          <Input value={form.slug} onChange={e => set('slug', slugify(e.target.value))} dir="ltr" />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="آیکون (اموجی)">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🌐" />
        </FormField>
        <FormField label="دسته‌بندی">
          <Input value={form.category} onChange={e => set('category', e.target.value)} placeholder="توسعه" />
        </FormField>
        <FormField label="قیمت">
          <Input value={form.price} onChange={e => set('price', e.target.value)} placeholder="از ۵ میلیون تومان" />
        </FormField>
      </div>
      <FormField label="توضیحات">
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} />
      </FormField>
      <FormField label="متن لینک">
        <Input value={form.linkLabel} onChange={e => set('linkLabel', e.target.value)} />
      </FormField>

      {/* Features */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[0.82rem] font-medium text-text-secondary">آیتم‌های سرویس</label>
          <button onClick={addFeature} className="text-xs text-accent-yellow cursor-pointer bg-transparent border-none">+ افزودن</button>
        </div>
        <div className="flex flex-col gap-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={f.title} onChange={e => updateFeature(i, e.target.value)} placeholder={`آیتم ${i + 1}…`} className="flex-1" />
              {form.features.length > 1 && (
                <button onClick={() => removeFeature(i)} className="text-red-400/60 hover:text-red-400 bg-transparent border-none cursor-pointer text-xl leading-none">×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
        <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="accent-[#F5C518] w-4 h-4 cursor-pointer" />
        فعال
      </label>

      <div className="flex justify-end gap-3 pt-2 border-t border-border-default">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}
          {initial ? 'ذخیره' : 'ایجاد سرویس'}
        </button>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await serviceApi.getAll();
      setServices(res.data || res.services || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await adminApi.updateService(editItem.id, data);
        showToast('سرویس بروزرسانی شد');
      } else {
        await adminApi.createService(data);
        showToast('سرویس ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="خدمات"
        description={`${services.length} خدمت`}
        actions={
          <button onClick={() => { setEditItem(null); setShowForm(true); }}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity">
            + خدمت جدید
          </button>
        }
      />
      <Card>
        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && services.length === 0 && (
          <EmptyState icon="🛠️" title="خدمتی تعریف نشده"
            action={<button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">+ خدمت جدید</button>}
          />
        )}
        {!loading && !error && services.length > 0 && (
          <Table columns={[{ label: 'خدمت' }, { label: 'دسته' }, { label: 'قیمت' }, { label: 'آیتم‌ها' }, { label: 'وضعیت' }, { label: '', className: 'text-center' }]}>
            {services.map(s => (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon || '🛠️'}</span>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{s.title}</p>
                      <p className="text-text-muted text-xs font-mono" dir="ltr">{s.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-text-secondary text-xs">{s.category || '—'}</span></Td>
                <Td><span className="text-text-secondary text-xs">{s.price || '—'}</span></Td>
                <Td><span className="text-text-secondary text-sm">{(s.features || []).length}</span></Td>
                <Td><Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'فعال' : 'غیرفعال'}</Badge></Td>
                <Td className="text-center">
                  <button onClick={() => { setEditItem({ ...s, features: s.features || [{ title: '' }] }); setShowForm(true); }}
                    className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    ویرایش
                  </button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
      {showForm && (
        <Modal title={editItem ? `ویرایش: ${editItem.title}` : 'خدمت جدید'} onClose={() => { setShowForm(false); setEditItem(null); }} maxWidth="max-w-2xl">
          <ServiceForm initial={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} saving={saving} />
        </Modal>
      )}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}
