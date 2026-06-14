// src/pages/admin/AdminServicesPage.jsx
import { useState, useCallback } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Modal, FormField, Input, Textarea, Toast, Spinner, ConfirmDialog,
} from './AdminUI';
import { adminApi, serviceApi } from '../../services/api';
import { useAdminServices } from '../../hooks/useServices';

// ─── helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

// نرمال‌سازی داده سرویس برای فرم ویرایش
function toFormData(s) {
  return {
    title:    s.title    || '',
    slug:     s.slug     || '',
    icon:     s.icon     || '🌐',
    category: s.category || '',
    price:    s.price    || '',
    linkText: s.linkText || s.linkLabel || 'مشاوره رایگان ←',
    description: s.description || '',
    isActive: s.isActive ?? true,
    // features از بک‌اند به صورت [{label, sortOrder}] می‌آید
    features: (s.features || []).map(f => ({ title: f.label || f.title || f })),
  };
}

const EMPTY_FORM = {
  title: '', slug: '', icon: '🌐',
  category: '', price: '', linkText: 'مشاوره رایگان ←',
  description: '', isActive: true,
  features: [{ title: '' }],
};

// ─── ServiceForm ─────────────────────────────────────────────────────────────

function ServiceForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? toFormData(initial) : EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addFeature    = () => set('features', [...form.features, { title: '' }]);
  const removeFeature = (i) => set('features', form.features.filter((_, idx) => idx !== i));
  const updateFeature = (i, v) =>
    set('features', form.features.map((f, idx) => idx === i ? { ...f, title: v } : f));

  const submit = () => {
    if (!form.title.trim()) { alert('عنوان الزامی است'); return; }
    if (!form.category.trim()) { alert('دسته‌بندی الزامی است'); return; }
    const payload = {
      title:       form.title.trim(),
      slug:        form.slug.trim() || slugify(form.title),
      icon:        form.icon.trim(),
      category:    form.category.trim(),
      price:       form.price.trim()    || null,
      linkText:    form.linkText.trim() || null,
      description: form.description.trim() || null,
      isActive:    form.isActive,
      // بک‌اند آرایه‌ای از string می‌خواهد
      features:    form.features.map(f => f.title.trim()).filter(Boolean),
    };
    onSave(payload);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ردیف اول: عنوان + اسلاگ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="عنوان" required>
          <Input
            value={form.title}
            onChange={e => {
              set('title', e.target.value);
              if (!initial) set('slug', slugify(e.target.value));
            }}
            placeholder="توسعه وب‌سایت"
          />
        </FormField>
        <FormField label="اسلاگ" required>
          <Input
            value={form.slug}
            onChange={e => set('slug', slugify(e.target.value))}
            dir="ltr"
            placeholder="web-development"
          />
        </FormField>
      </div>

      {/* ردیف دوم: آیکون + دسته‌بندی + قیمت */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="آیکون (اموجی)">
          <Input
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="🌐"
          />
        </FormField>
        <FormField label="دسته‌بندی" required>
          <Input
            value={form.category}
            onChange={e => set('category', e.target.value)}
            placeholder="دسته ۱"
          />
        </FormField>
        <FormField label="قیمت">
          <Input
            value={form.price}
            onChange={e => set('price', e.target.value)}
            placeholder="از ۵ میلیون تومان"
          />
        </FormField>
      </div>

      {/* توضیحات */}
      <FormField label="توضیحات">
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="توضیح کوتاه درباره این سرویس..."
        />
      </FormField>

      {/* متن لینک */}
      <FormField label="متن لینک">
        <Input
          value={form.linkText}
          onChange={e => set('linkText', e.target.value)}
          placeholder="مشاوره رایگان ←"
        />
      </FormField>

      {/* آیتم‌های سرویس */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[0.82rem] font-medium text-text-secondary">آیتم‌های سرویس</label>
          <button
            onClick={addFeature}
            className="text-xs text-accent-yellow cursor-pointer bg-transparent border-none"
          >
            + افزودن
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={f.title}
                onChange={e => updateFeature(i, e.target.value)}
                placeholder={`آیتم ${i + 1}…`}
                className="flex-1"
              />
              {form.features.length > 1 && (
                <button
                  onClick={() => removeFeature(i)}
                  className="text-red-400/60 hover:text-red-400 bg-transparent border-none cursor-pointer text-xl leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* وضعیت */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={e => set('isActive', e.target.checked)}
          className="accent-[#F5C518] w-4 h-4 cursor-pointer"
        />
        فعال
      </label>

      {/* دکمه‌ها */}
      <div className="flex justify-end gap-3 pt-2 border-t border-border-default">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors"
        >
          انصراف
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Spinner size={4} />}
          {initial ? 'ذخیره' : 'ایجاد سرویس'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const { services, loading, error, reload } = useAdminServices();
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [deleteItem,  setDeleteItem]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [toggling,    setToggling]    = useState(null); // id در حال تغییر
  const [toast,       setToast]       = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── ذخیره (ایجاد / ویرایش) ──────────────────────────────────────────────
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
      setShowForm(false);
      setEditItem(null);
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── toggle فعال/غیرفعال ─────────────────────────────────────────────────
  const handleToggle = async (service) => {
    setToggling(service.id);
    try {
      await adminApi.toggleService(service.id);
      showToast(service.isActive ? 'سرویس غیرفعال شد' : 'سرویس فعال شد');
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setToggling(null);
    }
  };

  // ─── حذف ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteService(deleteItem.id);
      showToast('سرویس حذف شد');
      setDeleteItem(null);
      reload();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditItem(null); setShowForm(true); };
  const openEdit   = (s) => { setEditItem(s);   setShowForm(true); };
  const closeForm  = ()  => { setShowForm(false); setEditItem(null); };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="خدمات"
        description={`${services.length} خدمت`}
        actions={
          <button
            onClick={openCreate}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            + خدمت جدید
          </button>
        }
      />

      <Card>
        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && services.length === 0 && (
          <EmptyState
            icon="🛠️"
            title="خدمتی تعریف نشده"
            action={
              <button
                onClick={openCreate}
                className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer"
              >
                + خدمت جدید
              </button>
            }
          />
        )}

        {!loading && !error && services.length > 0 && (
          <Table
            columns={[
              { label: 'خدمت' },
              { label: 'دسته' },
              { label: 'قیمت' },
              { label: 'آیتم‌ها' },
              { label: 'وضعیت' },
              { label: '', className: 'text-center' },
            ]}
          >
            {services.map(s => (
              <Tr key={s.id}>
                {/* عنوان و slug */}
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon || '🛠️'}</span>
                    <div>
                      <p className="text-text-primary text-sm font-medium">{s.title}</p>
                      <p className="text-text-muted text-xs font-mono" dir="ltr">{s.slug}</p>
                    </div>
                  </div>
                </Td>

                <Td>
                  <span className="text-text-secondary text-xs">{s.category || '—'}</span>
                </Td>

                <Td>
                  <span className="text-text-secondary text-xs">{s.price || '—'}</span>
                </Td>

                <Td>
                  <span className="text-text-secondary text-sm">{(s.features || []).length}</span>
                </Td>

                {/* وضعیت — قابل کلیک برای toggle */}
                <Td>
                  <button
                    onClick={() => handleToggle(s)}
                    disabled={toggling === s.id}
                    title="کلیک برای تغییر وضعیت"
                    className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                  >
                    {toggling === s.id
                      ? <Spinner size={3} />
                      : <Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                    }
                  </button>
                </Td>

                {/* اکشن‌ها */}
                <Td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => setDeleteItem(s)}
                      className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* مودال فرم */}
      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.title}` : 'خدمت جدید'}
          onClose={closeForm}
          maxWidth="max-w-2xl"
        >
          <ServiceForm
            initial={editItem}
            onSave={handleSave}
            onClose={closeForm}
            saving={saving}
          />
        </Modal>
      )}

      {/* تأیید حذف */}
      {deleteItem && (
        <ConfirmDialog
          title="حذف خدمت"
          description={`آیا از حذف «${deleteItem.title}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}
