// src/pages/admin/AdminOrderFormConfigPage.jsx
import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Modal, FormField, Input, Textarea, Select, Toast, Spinner, ConfirmDialog,
} from './AdminUI';

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('tesign_token');
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
  return data;
}

const orderConfigApi = {
  // Main Categories
  getMainCategories:    ()           => apiFetch('/admin/order-config/main-categories'),
  createMainCategory:   (body)       => apiFetch('/admin/order-config/main-categories',          { method: 'POST',  body: JSON.stringify(body) }),
  updateMainCategory:   (id, body)   => apiFetch(`/admin/order-config/main-categories/${id}`,    { method: 'PATCH', body: JSON.stringify(body) }),
  deleteMainCategory:   (id)         => apiFetch(`/admin/order-config/main-categories/${id}`,    { method: 'DELETE' }),
  reorderMainCategories:(items)      => apiFetch('/admin/order-config/main-categories/reorder',  { method: 'PATCH', body: JSON.stringify({ items }) }),

  // Subcategories
  getSubcategories:     (mainCategoryId) => apiFetch(`/admin/order-config/subcategories?mainCategoryId=${mainCategoryId}`),
  createSubcategory:    (body)           => apiFetch('/admin/order-config/subcategories',        { method: 'POST',  body: JSON.stringify(body) }),
  updateSubcategory:    (id, body)       => apiFetch(`/admin/order-config/subcategories/${id}`,  { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSubcategory:    (id)             => apiFetch(`/admin/order-config/subcategories/${id}`,  { method: 'DELETE' }),
  reorderSubcategories: (items)          => apiFetch('/admin/order-config/subcategories/reorder',{ method: 'PATCH', body: JSON.stringify({ items }) }),

  // Budget Options
  getBudgetOptions:    ()           => apiFetch('/admin/order-config/budget-options'),
  createBudgetOption:  (body)       => apiFetch('/admin/order-config/budget-options',            { method: 'POST',  body: JSON.stringify(body) }),
  updateBudgetOption:  (id, body)   => apiFetch(`/admin/order-config/budget-options/${id}`,      { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBudgetOption:  (id)         => apiFetch(`/admin/order-config/budget-options/${id}`,      { method: 'DELETE' }),
  reorderBudgetOptions:(items)      => apiFetch('/admin/order-config/budget-options/reorder',    { method: 'PATCH', body: JSON.stringify({ items }) }),

  // Timeline Options
  getTimelineOptions:    ()         => apiFetch('/admin/order-config/timeline-options'),
  createTimelineOption:  (body)     => apiFetch('/admin/order-config/timeline-options',          { method: 'POST',  body: JSON.stringify(body) }),
  updateTimelineOption:  (id, body) => apiFetch(`/admin/order-config/timeline-options/${id}`,    { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTimelineOption:  (id)       => apiFetch(`/admin/order-config/timeline-options/${id}`,    { method: 'DELETE' }),
  reorderTimelineOptions:(items)    => apiFetch('/admin/order-config/timeline-options/reorder',  { method: 'PATCH', body: JSON.stringify({ items }) }),

  // Price Estimates
  getPriceEstimates:    ()         => apiFetch('/admin/order-config/price-estimates'),
  createPriceEstimate:  (body)     => apiFetch('/admin/order-config/price-estimates',            { method: 'POST',  body: JSON.stringify(body) }),
  updatePriceEstimate:  (id, body) => apiFetch(`/admin/order-config/price-estimates/${id}`,      { method: 'PATCH', body: JSON.stringify(body) }),
  deletePriceEstimate:  (id)       => apiFetch(`/admin/order-config/price-estimates/${id}`,      { method: 'DELETE' }),
};

// ── Shared Utilities ──────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return [toast, show, () => setToast(null)];
}

function ActiveToggle({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="accent-[#F5C518] w-4 h-4 cursor-pointer"
      />
      فعال
    </label>
  );
}

function SortOrderInput({ value, onChange }) {
  return (
    <FormField label="ترتیب نمایش">
      <Input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        placeholder="0"
      />
    </FormField>
  );
}

function FormActions({ onClose, saving, isEdit }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors"
      >
        انصراف
      </button>
      <button
        disabled={saving}
        type="submit"
        className="px-5 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2"
      >
        {saving && <Spinner size={4} />}
        {isEdit ? 'ذخیره تغییرات' : 'ایجاد'}
      </button>
    </div>
  );
}

// Row actions shared button styles
const editBtnCls = "text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors";
const deleteBtnCls = "text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors";

// ── Tab Navigation ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'main-categories', label: 'دسته‌بندی‌ها',    icon: '🗂️' },
  { id: 'subcategories',   label: 'زیردسته‌ها',       icon: '📋' },
  { id: 'budget',          label: 'بازه بودجه',       icon: '💰' },
  { id: 'timeline',        label: 'زمانبندی',         icon: '⏰' },
  { id: 'estimates',       label: 'تخمین قیمت',       icon: '💡' },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-bg-base rounded-xl border border-border-default mb-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border
            ${active === tab.id
              ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/25'
              : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-white/5'
            }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── SECTION: Main Categories ──────────────────────────────────────────────────

const EMPTY_MAIN_CAT = { key: '', title: '', description: '', icon: '🌐', sortOrder: 0, isActive: true };

function MainCategoryForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_MAIN_CAT });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.key.trim())   { alert('کلید (key) الزامی است'); return; }
    if (!form.title.trim()) { alert('عنوان الزامی است'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="کلید (key)" required hint="مثال: web_design — باید یکتا باشد">
          <Input
            value={form.key}
            onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="web_design"
            dir="ltr"
          />
        </FormField>
        <FormField label="عنوان" required>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="طراحی وب‌سایت" />
        </FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="آیکون (اموجی)">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🌐" />
        </FormField>
        <SortOrderInput value={form.sortOrder} onChange={v => set('sortOrder', v)} />
        <div className="flex items-end pb-1">
          <ActiveToggle value={form.isActive} onChange={v => set('isActive', v)} />
        </div>
      </div>
      <FormField label="توضیحات">
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="وب‌سایت شرکتی، فروشگاهی، خبری..." />
      </FormField>
      <FormActions onClose={onClose} saving={saving} isEdit={!!initial} />
    </form>
  );
}

function MainCategoriesTab({ onSubcategoryTab }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, showToast, clearToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await orderConfigApi.getMainCategories();
      setItems(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await orderConfigApi.updateMainCategory(editItem.id, data);
        showToast('دسته‌بندی بروزرسانی شد');
      } else {
        await orderConfigApi.createMainCategory(data);
        showToast('دسته‌بندی ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderConfigApi.deleteMainCategory(deleteItem.id);
      showToast('دسته‌بندی حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">دسته‌بندی‌های اصلی</h2>
          <p className="text-text-muted text-xs mt-0.5">مانند: طراحی وب‌سایت، هویت بصری، UI/UX</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          + دسته‌بندی جدید
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading && <div className="p-6"><LoadingState /></div>}
        {error   && <div className="p-6"><ErrorState message={error} onRetry={load} /></div>}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="🗂️"
            title="هیچ دسته‌بندی‌ای تعریف نشده"
            description="اولین دسته‌بندی اصلی فرم سفارش را بسازید"
            action={
              <button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + دسته‌بندی جدید
              </button>
            }
          />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-border-default">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-2xl flex-shrink-0">{item.icon || '🗂️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-semibold">{item.title}</span>
                    <span className="text-text-muted text-xs font-mono bg-bg-base px-1.5 py-0.5 rounded" dir="ltr">{item.key}</span>
                    <Badge color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                  {item.description && (
                    <p className="text-text-muted text-xs mt-1 truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs">
                  <span className="bg-bg-base border border-border-default rounded px-2 py-0.5">#{item.sortOrder}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onSubcategoryTab(item)}
                    className="text-xs text-blue-400 border border-blue-400/25 bg-blue-400/5 hover:bg-blue-400/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    زیردسته‌ها
                  </button>
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className={editBtnCls}>ویرایش</button>
                  <button onClick={() => setDeleteItem(item)} className={deleteBtnCls}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.title}` : 'دسته‌بندی اصلی جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-xl"
        >
          <MainCategoryForm
            initial={editItem}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف دسته‌بندی"
          description={`آیا از حذف «${deleteItem.title}» مطمئنید؟ تمام زیردسته‌های مرتبط نیز حذف خواهند شد.`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />
    </>
  );
}

// ── SECTION: Subcategories ────────────────────────────────────────────────────

const EMPTY_SUBCAT = { label: '', mainCategoryId: '', sortOrder: 0, isActive: true };

function SubcategoryForm({ initial, mainCategories, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_SUBCAT });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim())         { alert('عنوان الزامی است'); return; }
    if (!form.mainCategoryId)       { alert('دسته‌بندی اصلی الزامی است'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormField label="دسته‌بندی اصلی" required>
        <Select value={form.mainCategoryId} onChange={e => set('mainCategoryId', e.target.value)}>
          <option value="">— انتخاب کنید —</option>
          {mainCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.title}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="عنوان زیردسته" required>
        <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="فروشگاه اینترنتی" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <SortOrderInput value={form.sortOrder} onChange={v => set('sortOrder', v)} />
        <div className="flex items-end pb-1">
          <ActiveToggle value={form.isActive} onChange={v => set('isActive', v)} />
        </div>
      </div>
      <FormActions onClose={onClose} saving={saving} isEdit={!!initial} />
    </form>
  );
}

function SubcategoriesTab({ preselectedCategory }) {
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedCatId, setSelectedCatId]   = useState(preselectedCategory?.id || '');
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, showToast, clearToast] = useToast();

  // Load main categories for filter selector
  useEffect(() => {
    orderConfigApi.getMainCategories()
      .then(res => setMainCategories(res.data || []))
      .catch(() => {});
  }, []);

  // When preselected category changes from parent
  useEffect(() => {
    if (preselectedCategory?.id) setSelectedCatId(preselectedCategory.id);
  }, [preselectedCategory]);

  const loadSubs = useCallback(async () => {
    if (!selectedCatId) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const res = await orderConfigApi.getSubcategories(selectedCatId);
      setItems(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [selectedCatId]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await orderConfigApi.updateSubcategory(editItem.id, data);
        showToast('زیردسته بروزرسانی شد');
      } else {
        await orderConfigApi.createSubcategory(data);
        showToast('زیردسته ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      loadSubs();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderConfigApi.deleteSubcategory(deleteItem.id);
      showToast('زیردسته حذف شد');
      setDeleteItem(null);
      loadSubs();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  const selectedCat = mainCategories.find(c => c.id === selectedCatId);

  return (
    <>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary">زیردسته‌ها</h2>
          <p className="text-text-muted text-xs mt-0.5">گزینه‌های قابل انتخاب زیر هر دسته‌بندی اصلی</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          disabled={!selectedCatId}
          className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + زیردسته جدید
        </button>
      </div>

      {/* Category Selector */}
      <div className="mb-4">
        <Select
          value={selectedCatId}
          onChange={e => setSelectedCatId(e.target.value)}
          className="max-w-xs"
        >
          <option value="">— دسته‌بندی اصلی را انتخاب کنید —</option>
          {mainCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.title}</option>
          ))}
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        {!selectedCatId && (
          <EmptyState
            icon="👆"
            title="دسته‌بندی اصلی انتخاب کنید"
            description="برای نمایش زیردسته‌ها، ابتدا یک دسته‌بندی اصلی انتخاب کنید"
          />
        )}
        {selectedCatId && loading && <div className="p-6"><LoadingState /></div>}
        {selectedCatId && error   && <div className="p-6"><ErrorState message={error} onRetry={loadSubs} /></div>}
        {selectedCatId && !loading && !error && items.length === 0 && (
          <EmptyState
            icon="📋"
            title={`زیردسته‌ای برای «${selectedCat?.title || ''}» تعریف نشده`}
            action={
              <button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + زیردسته جدید
              </button>
            }
          />
        )}
        {selectedCatId && !loading && !error && items.length > 0 && (
          <div className="divide-y divide-border-default">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-medium">{item.label}</span>
                    <Badge color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                </div>
                <span className="text-text-muted text-xs bg-bg-base border border-border-default rounded px-2 py-0.5">#{item.sortOrder}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className={editBtnCls}>ویرایش</button>
                  <button onClick={() => setDeleteItem(item)} className={deleteBtnCls}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.label}` : 'زیردسته جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-lg"
        >
          <SubcategoryForm
            initial={editItem ? { ...editItem } : { ...EMPTY_SUBCAT, mainCategoryId: selectedCatId }}
            mainCategories={mainCategories}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف زیردسته"
          description={`آیا از حذف «${deleteItem.label}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />
    </>
  );
}

// ── SECTION: Budget Options ───────────────────────────────────────────────────

const EMPTY_BUDGET = { label: '', value: '', icon: '💰', sortOrder: 0, isActive: true };

function BudgetForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_BUDGET });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) { alert('عنوان الزامی است'); return; }
    if (!form.value.trim()) { alert('مقدار (value) الزامی است'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="عنوان" required hint="مثال: ۲ تا ۵ میلیون تومان">
          <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="۲ تا ۵ میلیون تومان" />
        </FormField>
        <FormField label="مقدار (value)" required hint="مثال: 2m_5m — یکتا باشد">
          <Input value={form.value} onChange={e => set('value', e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="2m_5m" dir="ltr" />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="آیکون">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="💰" />
        </FormField>
        <SortOrderInput value={form.sortOrder} onChange={v => set('sortOrder', v)} />
        <div className="flex items-end pb-1">
          <ActiveToggle value={form.isActive} onChange={v => set('isActive', v)} />
        </div>
      </div>
      <FormActions onClose={onClose} saving={saving} isEdit={!!initial} />
    </form>
  );
}

function BudgetTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, showToast, clearToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await orderConfigApi.getBudgetOptions();
      setItems(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await orderConfigApi.updateBudgetOption(editItem.id, data);
        showToast('گزینه بودجه بروزرسانی شد');
      } else {
        await orderConfigApi.createBudgetOption(data);
        showToast('گزینه بودجه ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderConfigApi.deleteBudgetOption(deleteItem.id);
      showToast('گزینه بودجه حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">بازه‌های بودجه</h2>
          <p className="text-text-muted text-xs mt-0.5">گزینه‌های انتخاب بودجه در فرم سفارش</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          + گزینه جدید
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading && <div className="p-6"><LoadingState /></div>}
        {error   && <div className="p-6"><ErrorState message={error} onRetry={load} /></div>}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="💰"
            title="هیچ بازه بودجه‌ای تعریف نشده"
            action={
              <button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + گزینه جدید
              </button>
            }
          />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-border-default">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-xl flex-shrink-0">{item.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-medium">{item.label}</span>
                    <span className="text-text-muted text-xs font-mono bg-bg-base px-1.5 py-0.5 rounded" dir="ltr">{item.value}</span>
                    <Badge color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                </div>
                <span className="text-text-muted text-xs bg-bg-base border border-border-default rounded px-2 py-0.5">#{item.sortOrder}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className={editBtnCls}>ویرایش</button>
                  <button onClick={() => setDeleteItem(item)} className={deleteBtnCls}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.label}` : 'بازه بودجه جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-lg"
        >
          <BudgetForm
            initial={editItem}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف بازه بودجه"
          description={`آیا از حذف «${deleteItem.label}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />
    </>
  );
}

// ── SECTION: Timeline Options ─────────────────────────────────────────────────

const EMPTY_TIMELINE = { label: '', value: '', sortOrder: 0, isActive: true };

function TimelineForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_TIMELINE });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) { alert('عنوان الزامی است'); return; }
    if (!form.value.trim()) { alert('مقدار (value) الزامی است'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="عنوان" required hint="مثال: ۲ تا ۳ ماه">
          <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="۲ تا ۳ ماه" />
        </FormField>
        <FormField label="مقدار (value)" required hint="مثال: 2m_3m">
          <Input value={form.value} onChange={e => set('value', e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="2m_3m" dir="ltr" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SortOrderInput value={form.sortOrder} onChange={v => set('sortOrder', v)} />
        <div className="flex items-end pb-1">
          <ActiveToggle value={form.isActive} onChange={v => set('isActive', v)} />
        </div>
      </div>
      <FormActions onClose={onClose} saving={saving} isEdit={!!initial} />
    </form>
  );
}

function TimelineTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, showToast, clearToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await orderConfigApi.getTimelineOptions();
      setItems(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await orderConfigApi.updateTimelineOption(editItem.id, data);
        showToast('گزینه زمانبندی بروزرسانی شد');
      } else {
        await orderConfigApi.createTimelineOption(data);
        showToast('گزینه زمانبندی ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderConfigApi.deleteTimelineOption(deleteItem.id);
      showToast('گزینه زمانبندی حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">بازه‌های زمانبندی</h2>
          <p className="text-text-muted text-xs mt-0.5">گزینه‌های انتخاب زمانبندی پروژه</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          + گزینه جدید
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading && <div className="p-6"><LoadingState /></div>}
        {error   && <div className="p-6"><ErrorState message={error} onRetry={load} /></div>}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="⏰"
            title="هیچ بازه زمانبندی‌ای تعریف نشده"
            action={
              <button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + گزینه جدید
              </button>
            }
          />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-border-default">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-xl flex-shrink-0">⏱️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-medium">{item.label}</span>
                    <span className="text-text-muted text-xs font-mono bg-bg-base px-1.5 py-0.5 rounded" dir="ltr">{item.value}</span>
                    <Badge color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                </div>
                <span className="text-text-muted text-xs bg-bg-base border border-border-default rounded px-2 py-0.5">#{item.sortOrder}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className={editBtnCls}>ویرایش</button>
                  <button onClick={() => setDeleteItem(item)} className={deleteBtnCls}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <Modal
          title={editItem ? `ویرایش: ${editItem.label}` : 'بازه زمانبندی جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-lg"
        >
          <TimelineForm
            initial={editItem}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف بازه زمانبندی"
          description={`آیا از حذف «${deleteItem.label}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />
    </>
  );
}

// ── SECTION: Price Estimates ──────────────────────────────────────────────────

const EMPTY_ESTIMATE = {
  budgetOptionId: '',
  timelineOptionId: '',
  minAmount: '',
  maxAmount: '',
  unit: 'میلیون تومان',
  isActive: true,
};

function EstimateForm({ initial, budgetOptions, timelineOptions, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial, budgetOptionId: initial.budgetOptionId || '', timelineOptionId: initial.timelineOptionId || '' } : { ...EMPTY_ESTIMATE });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.minAmount || !form.maxAmount) { alert('حداقل و حداکثر قیمت الزامی است'); return; }
    onSave({
      ...form,
      budgetOptionId:   form.budgetOptionId   || null,
      timelineOptionId: form.timelineOptionId || null,
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
    });
  };

  const isDefault = !form.budgetOptionId && !form.timelineOptionId;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-xl border border-border-default bg-bg-base px-4 py-3 text-xs text-text-muted leading-relaxed">
        <strong className="text-text-secondary">منطق تطبیق:</strong> اگر هر دو خالی باشند → قانون پیش‌فرض (fallback).
        اولویت: تطبیق دقیق هر دو → فقط بودجه → فقط زمانبندی → پیش‌فرض.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="بازه بودجه" hint="خالی = هر بودجه‌ای">
          <Select value={form.budgetOptionId} onChange={e => set('budgetOptionId', e.target.value)}>
            <option value="">— هر بودجه‌ای —</option>
            {budgetOptions.map(b => (
              <option key={b.id} value={b.id}>{b.icon} {b.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="بازه زمانبندی" hint="خالی = هر زمانبندی‌ای">
          <Select value={form.timelineOptionId} onChange={e => set('timelineOptionId', e.target.value)}>
            <option value="">— هر زمانبندی‌ای —</option>
            {timelineOptions.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {isDefault && (
        <div className="rounded-xl bg-accent-yellow/5 border border-accent-yellow/20 px-4 py-2.5 text-xs text-accent-yellow">
          ⚠️ این قانون به‌عنوان <strong>پیش‌فرض کلی (fallback)</strong> ثبت می‌شود
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="حداقل مبلغ" required>
          <Input type="number" min="0" value={form.minAmount} onChange={e => set('minAmount', e.target.value)} placeholder="8" dir="ltr" />
        </FormField>
        <FormField label="حداکثر مبلغ" required>
          <Input type="number" min="0" value={form.maxAmount} onChange={e => set('maxAmount', e.target.value)} placeholder="30" dir="ltr" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="واحد">
          <Input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="میلیون تومان" />
        </FormField>
        <div className="flex items-end pb-1">
          <ActiveToggle value={form.isActive} onChange={v => set('isActive', v)} />
        </div>
      </div>

      <FormActions onClose={onClose} saving={saving} isEdit={!!initial} />
    </form>
  );
}

function EstimatesTab() {
  const [items, setItems]         = useState([]);
  const [budgetOptions, setBudget] = useState([]);
  const [timelineOptions, setTimeline] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState(null);
  const [showForm, setShowForm]  = useState(false);
  const [editItem, setEditItem]  = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]      = useState(false);
  const [deleting, setDeleting]  = useState(false);
  const [toast, showToast, clearToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [estRes, budRes, timRes] = await Promise.all([
        orderConfigApi.getPriceEstimates(),
        orderConfigApi.getBudgetOptions(),
        orderConfigApi.getTimelineOptions(),
      ]);
      setItems(estRes.data || []);
      setBudget(budRes.data || []);
      setTimeline(timRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await orderConfigApi.updatePriceEstimate(editItem.id, data);
        showToast('قانون قیمت‌گذاری بروزرسانی شد');
      } else {
        await orderConfigApi.createPriceEstimate(data);
        showToast('قانون قیمت‌گذاری ایجاد شد');
      }
      setShowForm(false); setEditItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderConfigApi.deletePriceEstimate(deleteItem.id);
      showToast('قانون قیمت‌گذاری حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  const getBudgetLabel = (id) => budgetOptions.find(b => b.id === id)?.label || '—';
  const getTimelineLabel = (id) => timelineOptions.find(t => t.id === id)?.label || '—';

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">قوانین تخمین قیمت</h2>
          <p className="text-text-muted text-xs mt-0.5">بر اساس ترکیب بودجه + زمانبندی نمایش داده می‌شود</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          + قانون جدید
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading && <div className="p-6"><LoadingState /></div>}
        {error   && <div className="p-6"><ErrorState message={error} onRetry={load} /></div>}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="💡"
            title="هیچ قانون قیمت‌گذاری تعریف نشده"
            action={
              <button onClick={() => setShowForm(true)} className="grad-bg text-[#111] font-bold text-sm px-4 py-2 rounded-lg border-none cursor-pointer">
                + قانون جدید
              </button>
            }
          />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-border-default">
            {items.map(item => {
              const isDefault = !item.budgetOptionId && !item.timelineOptionId;
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isDefault ? (
                        <span className="text-xs font-bold text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/20 rounded-full px-2.5 py-0.5">پیش‌فرض</span>
                      ) : (
                        <>
                          {item.budgetOptionId && (
                            <span className="text-xs text-text-secondary bg-bg-base border border-border-default rounded-full px-2.5 py-0.5">
                              💰 {getBudgetLabel(item.budgetOptionId)}
                            </span>
                          )}
                          {item.timelineOptionId && (
                            <span className="text-xs text-text-secondary bg-bg-base border border-border-default rounded-full px-2.5 py-0.5">
                              ⏱️ {getTimelineLabel(item.timelineOptionId)}
                            </span>
                          )}
                        </>
                      )}
                      <Badge color={item.isActive ? 'green' : 'red'}>{item.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                    </div>
                    <p className="text-text-primary text-sm font-bold">
                      {item.minAmount} تا {item.maxAmount}{' '}
                      <span className="text-text-muted font-normal text-xs">{item.unit}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditItem(item); setShowForm(true); }} className={editBtnCls}>ویرایش</button>
                    <button onClick={() => setDeleteItem(item)} className={deleteBtnCls}>حذف</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showForm && (
        <Modal
          title={editItem ? 'ویرایش قانون قیمت‌گذاری' : 'قانون قیمت‌گذاری جدید'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          maxWidth="max-w-lg"
        >
          <EstimateForm
            initial={editItem}
            budgetOptions={budgetOptions}
            timelineOptions={timelineOptions}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            saving={saving}
          />
        </Modal>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف قانون قیمت‌گذاری"
          description="آیا از حذف این قانون مطمئنید؟"
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={clearToast} />
    </>
  );
}

// ── Live Preview Panel ────────────────────────────────────────────────────────

function LivePreviewBanner() {
  return (
    <a
      href="/order"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20 hover:bg-accent-yellow/10 transition-colors group mb-6 no-underline"
    >
      <span className="text-xl">👁️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-accent-yellow">مشاهده فرم سفارش در سایت</p>
        <p className="text-xs text-text-muted mt-0.5">تغییرات شما بلافاصله در صفحه ثبت سفارش اعمال می‌شود</p>
      </div>
      <span className="text-text-muted group-hover:text-accent-yellow transition-colors text-lg">←</span>
    </a>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminOrderFormConfigPage() {
  const [activeTab, setActiveTab] = useState('main-categories');
  const [subcategoryPreselect, setSubcategoryPreselect] = useState(null);

  const handleSubcategoryTab = (mainCat) => {
    setSubcategoryPreselect(mainCat);
    setActiveTab('subcategories');
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="تنظیمات فرم سفارش"
        description="مدیریت دسته‌بندی‌ها، بودجه، زمانبندی و قوانین تخمین قیمت فرم ثبت سفارش"
      />

      <LivePreviewBanner />

      <TabBar active={activeTab} onChange={tab => { setActiveTab(tab); if (tab !== 'subcategories') setSubcategoryPreselect(null); }} />

      {activeTab === 'main-categories' && (
        <MainCategoriesTab onSubcategoryTab={handleSubcategoryTab} />
      )}
      {activeTab === 'subcategories' && (
        <SubcategoriesTab preselectedCategory={subcategoryPreselect} />
      )}
      {activeTab === 'budget' && <BudgetTab />}
      {activeTab === 'timeline' && <TimelineTab />}
      {activeTab === 'estimates' && <EstimatesTab />}
    </AdminLayout>
  );
}