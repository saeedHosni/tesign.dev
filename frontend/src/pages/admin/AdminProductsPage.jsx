// src/pages/admin/AdminProductsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Pagination,
  Modal, ConfirmDialog, FormField, Input, Textarea, Select, Toast, Spinner,
} from './AdminUI';
import { adminApi, productApi } from '../../services/api';
import AdminProductContentManager from './AdminProductContentManager';

const BADGE_OPTIONS = ['', 'bestseller', 'new', 'featured'];
const BADGE_LABELS  = { '': 'بدون برچسب', bestseller: 'پرفروش', new: 'جدید', featured: 'پیشنهادی' };

const EMPTY_FORM = {
  name: '', slug: '', subtitle: '', description: '',
  price: '', comparePrice: '', stock: '', icon: '⚡',
  badge: '', categoryId: '', tags: '', isFeatured: false, isActive: true,
};

function slugify(str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function ProductImagesManager({ product, showToast, onChange }) {
  const [images, setImages]     = useState(product.images || []);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { setImages(product.images || []); }, [product.id]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await adminApi.uploadImage(file);
      const fileData = uploadRes.data || uploadRes.file || uploadRes;
      const url = fileData.url;
      const filename = fileData.filename;
      if (!url) throw new Error('آپلود فایل ناموفق بود');

      const addRes = await adminApi.addProductImage(product.id, { url, alt: product.name });
      const newImage = addRes.data || addRes.image || { id: filename, url, alt: product.name, filename };

      const updated = [...images, newImage];
      setImages(updated);
      onChange?.(updated);
      showToast('تصویر اضافه شد');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (img) => {
    if (!confirm('آیا از حذف این تصویر مطمئنید؟')) return;
    setDeletingId(img.id);
    try {
      await adminApi.deleteProductImage(product.id, img.id);

      // اگر فایل آپلود شده روی سرور است، آن را هم حذف کن
      const filename = img.filename || (img.url ? img.url.split('/').pop() : null);
      if (filename) {
        try { await adminApi.deleteFile(filename); } catch { /* فایل ممکن است قبلاً حذف شده باشد */ }
      }

      const updated = images.filter(i => i.id !== img.id);
      setImages(updated);
      onChange?.(updated);
      showToast('تصویر حذف شد');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <FormField label="گالری تصاویر محصول" hint="فرمت‌های مجاز: jpeg, png, webp, gif, svg — حداکثر ۱۰ مگابایت">
      <div className="flex flex-wrap gap-3">
        {images.map(img => (
          <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border-default group">
            <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDeleteImage(img)}
              disabled={deletingId === img.id}
              className="absolute inset-0 bg-black/60 text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-none disabled:opacity-100"
            >
              {deletingId === img.id ? <Spinner size={4} /> : 'حذف'}
            </button>
          </div>
        ))}

        <label className="w-20 h-20 rounded-lg border border-dashed border-border-default flex items-center justify-center cursor-pointer text-text-muted hover:text-accent-yellow hover:border-accent-yellow/40 transition-colors text-xs">
          {uploading ? <Spinner size={4} /> : '+ افزودن'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </FormField>
  );
}

function ProductForm({ initial, categories, onSave, onClose, saving, showToast }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (v) => {
    set('name', v);
    if (!initial) set('slug', slugify(v));
  };

  const handleSubmit = () => {
    if (!form.name.trim())  { alert('نام محصول الزامی است'); return; }
    if (!form.slug.trim())  { alert('اسلاگ الزامی است'); return; }
    if (!form.price)        { alert('قیمت الزامی است'); return; }
    const { images, ...rest } = form;
    onSave({
      ...rest,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock:        form.stock !== '' ? Number(form.stock) : null,
      tags:         typeof form.tags === 'string'
                      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
                      : form.tags,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {initial?.id && (
        <ProductImagesManager product={initial} showToast={showToast} onChange={(imgs) => set('images', imgs)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="نام محصول" required>
          <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="قالب آماده کسب‌وکار پرو" />
        </FormField>
        <FormField label="اسلاگ (URL)" required hint="فقط حروف انگلیسی، اعداد و خط تیره">
          <Input
            value={form.slug}
            onChange={e => set('slug', slugify(e.target.value))}
            placeholder="business-pro-theme"
            dir="ltr"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="قیمت (تومان)" required>
          <Input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="280000" dir="ltr" />
        </FormField>
        <FormField label="قیمت قبل از تخفیف" hint="اختیاری">
          <Input type="number" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} placeholder="350000" dir="ltr" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="موجودی" hint="خالی = نامحدود">
          <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="—" dir="ltr" />
        </FormField>
        <FormField label="آیکون (اموجی)">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="⚡" />
        </FormField>
        <FormField label="برچسب">
          <Select value={form.badge} onChange={e => set('badge', e.target.value)}>
            {BADGE_OPTIONS.map(o => <option key={o} value={o}>{BADGE_LABELS[o]}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="زیرعنوان">
        <Input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="مناسب شرکت‌ها و آژانس‌های دیجیتال" />
      </FormField>

      <FormField label="توضیحات">
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="توضیح کامل محصول…" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="دسته‌بندی">
          <Select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
            <option value="">بدون دسته</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="تگ‌ها" hint="با کاما جدا کنید">
          <Input
            value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')}
            onChange={e => set('tags', e.target.value)}
            placeholder="وردپرس, کسب‌وکار, آژانس"
          />
        </FormField>
      </div>

      <div className="flex items-center gap-6 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
          <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)}
            className="accent-[#F5C518] w-4 h-4 cursor-pointer" />
          محصول ویژه
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
            className="accent-[#F5C518] w-4 h-4 cursor-pointer" />
          فعال
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-default mt-2">
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">
          انصراف
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}
          {initial ? 'ذخیره تغییرات' : 'ایجاد محصول'}
        </button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [contentItem, setContentItem] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [toast,      setToast]      = useState(null);

  const PER_PAGE = 12;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prod, cats] = await Promise.all([
        adminApi.getProducts({ page, limit: PER_PAGE, search: search || undefined }),
        productApi.getCategories(),
      ]);
      setProducts(prod.data || prod.products || []);
      setTotal(prod.pagination?.total || prod.total || prod.count || 0);
      setCategories(cats.data || cats.categories || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (v) => { setSearch(v); setPage(1); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await adminApi.updateProduct(editItem.id, data);
        showToast('محصول بروزرسانی شد');
      } else {
        await adminApi.createProduct(data);
        showToast('محصول ایجاد شد');
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
      await adminApi.deleteProduct(deleteItem.id);
      showToast('محصول حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (p) => {
    setEditItem(p);
    setShowForm(true);
  };
  const openCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  const catName = (id) => categories.find(c => c.id === id)?.name || '—';

  return (
    <AdminLayout>
      <AdminPageHeader
        title="محصولات"
        description={`${total.toLocaleString('fa-IR')} محصول`}
        actions={
          <button onClick={openCreate}
            className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity">
            + محصول جدید
          </button>
        }
      />

      <Card>
        {/* Search */}
        <div className="mb-5">
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="جستجو در محصولات…"
            className="w-full sm:w-80 px-4 py-2.5 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
          />
        </div>

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && products.length === 0 && (
          <EmptyState
            icon="📦"
            title="محصولی یافت نشد"
            description={search ? 'جستجوی دیگری امتحان کنید' : 'اولین محصول را اضافه کنید'}
            action={!search && (
              <button onClick={openCreate}
                className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + محصول جدید
              </button>
            )}
          />
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <Table columns={[
              { label: 'محصول' },
              { label: 'دسته' },
              { label: 'قیمت' },
              { label: 'موجودی' },
              { label: 'وضعیت' },
              { label: 'عملیات', className: 'text-center' },
            ]}>
              {products.map(p => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{p.icon || '⚡'}</span>
                      <div>
                        <p className="text-text-primary text-sm font-medium">{p.name}</p>
                        <p className="text-text-muted text-xs font-mono" dir="ltr">{p.slug}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-text-secondary text-xs">{p.category?.name || catName(p.categoryId)}</span></Td>
                  <Td>
                    <div>
                      <span className="text-text-primary text-sm font-medium">{Number(p.price).toLocaleString('fa-IR')}</span>
                      {p.comparePrice && (
                        <span className="block text-text-muted text-xs line-through">{Number(p.comparePrice).toLocaleString('fa-IR')}</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span className={`text-xs ${p.stock === 0 ? 'text-red-400' : p.stock === null ? 'text-text-muted' : 'text-green-400'}`}>
                      {p.stock === null ? 'نامحدود' : p.stock === 0 ? 'ناموجود' : p.stock.toLocaleString('fa-IR')}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      {p.isFeatured && <Badge color="yellow">ویژه</Badge>}
                      <Badge color={p.isActive ? 'green' : 'red'}>{p.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                    </div>
                  </Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setContentItem(p)}
                        className="text-xs text-blue-400 border border-blue-400/25 bg-blue-400/5 hover:bg-blue-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        محتوا
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => setDeleteItem(p)}
                        className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.name}` : 'محصول جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-2xl"
        >
          <ProductForm
            initial={editItem ? {
              ...editItem,
              categoryId:   editItem.categoryId || editItem.category?.id || '',
              tags:         (editItem.tags || []).join(', '),
              comparePrice: editItem.comparePrice || '',
              stock:        editItem.stock ?? '',
            } : null}
            categories={categories}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
            showToast={showToast}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <ConfirmDialog
          title="حذف محصول"
          description={`آیا از حذف "${deleteItem.name}" مطمئنید؟ این عمل قابل بازگشت نیست.`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      {/* Content manager modal */}
      {contentItem && (
        <AdminProductContentManager
          product={contentItem}
          onClose={() => setContentItem(null)}
          showToast={showToast}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}