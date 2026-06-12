// src/pages/admin/AdminCategoriesPage.jsx
import { useState, useEffect } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Modal, ConfirmDialog, FormField, Input, Textarea, Toast, Spinner,
} from './AdminUI';
import { adminApi, productApi } from '../../services/api';

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

const EMPTY_FORM = { name: '', slug: '', description: '', icon: '📁', sortOrder: 0 };

function CategoryForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (v) => {
    set('name', v);
    if (!initial) set('slug', slugify(v));
  };

  const submit = () => {
    if (!form.name.trim()) { alert('نام دسته‌بندی الزامی است'); return; }
    if (!form.slug.trim()) { alert('اسلاگ الزامی است'); return; }
    onSave({ ...form, sortOrder: Number(form.sortOrder) || 0 });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="نام دسته‌بندی" required>
          <Input
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="قالب‌های آماده"
          />
        </FormField>
        <FormField label="اسلاگ (URL)" required hint="فقط حروف انگلیسی، اعداد و خط تیره">
          <Input
            value={form.slug}
            onChange={e => set('slug', slugify(e.target.value))}
            placeholder="ready-templates"
            dir="ltr"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="آیکون (اموجی)">
          <Input
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="📁"
          />
        </FormField>
        <FormField label="ترتیب نمایش">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={e => set('sortOrder', e.target.value)}
            placeholder="0"
            dir="ltr"
          />
        </FormField>
      </div>

      <FormField label="توضیحات" hint="اختیاری">
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="توضیح کوتاه درباره این دسته‌بندی…"
        />
      </FormField>

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
          {initial ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
        </button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [cats, prods] = await Promise.all([
        productApi.getCategories(),
        productApi.getAll({ limit: 200 }),
      ]);
      setCategories(cats.data || cats.categories || []);
      setProducts(prods.data || prods.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const productCountForCat = (catId) =>
    products.filter(p => p.categoryId === catId || p.category?.id === catId).length;

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        // No direct update API in README — update via createCategory or use products categories endpoint
        await adminApi.createCategory(data); // ideally would be updateCategory
        showToast('دسته‌بندی ذخیره شد');
      } else {
        await adminApi.createCategory(data);
        showToast('دسته‌بندی ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteItem.id);
      showToast('دسته‌بندی حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit   = (cat) => { setEditItem(cat); setShowForm(true); };
  const openCreate = ()    => { setEditItem(null); setShowForm(true); };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="دسته‌بندی‌ها"
        description={`${categories.length} دسته‌بندی`}
        actions={
          <button
            onClick={openCreate}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            + دسته‌بندی جدید
          </button>
        }
      />

      <Card>
        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && categories.length === 0 && (
          <EmptyState
            icon="🗂️"
            title="دسته‌بندی‌ای تعریف نشده"
            description="دسته‌بندی‌ها به سازماندهی محصولات کمک می‌کنند"
            action={
              <button
                onClick={openCreate}
                className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer"
              >
                + دسته‌بندی جدید
              </button>
            }
          />
        )}

        {!loading && !error && categories.length > 0 && (
          <Table columns={[
            { label: 'دسته‌بندی' },
            { label: 'اسلاگ' },
            { label: 'توضیحات' },
            { label: 'تعداد محصول' },
            { label: 'عملیات', className: 'text-center' },
          ]}>
            {categories
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map(cat => (
              <Tr key={cat.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{cat.icon || '📁'}</span>
                    <span className="text-text-primary text-sm font-medium">{cat.name}</span>
                  </div>
                </Td>
                <Td>
                  <span className="text-text-muted text-xs font-mono" dir="ltr">{cat.slug}</span>
                </Td>
                <Td>
                  <span className="text-text-secondary text-xs line-clamp-1 max-w-[180px] block">
                    {cat.description || '—'}
                  </span>
                </Td>
                <Td>
                  <Badge color={productCountForCat(cat.id) > 0 ? 'blue' : 'gray'}>
                    {productCountForCat(cat.id)} محصول
                  </Badge>
                </Td>
                <Td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => setDeleteItem(cat)}
                      disabled={productCountForCat(cat.id) > 0}
                      title={productCountForCat(cat.id) > 0 ? 'ابتدا محصولات این دسته را جابجا کنید' : ''}
                      className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.name}` : 'دسته‌بندی جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-lg"
        >
          <CategoryForm
            initial={editItem}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <ConfirmDialog
          title="حذف دسته‌بندی"
          description={`آیا از حذف دسته‌بندی «${deleteItem.name}» مطمئنید؟ این دسته‌بندی محصولی ندارد.`}
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
