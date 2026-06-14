// src/pages/admin/AdminProductContentManager.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Modal, ConfirmDialog, FormField, Input, Textarea, Spinner, Badge, EmptyState,
} from './AdminUI';
import { adminApi } from '../../services/api';

// ── Reorder helpers ──────────────────────────────────────────────────────────

function moveItem(list, index, dir) {
  const target = index + dir;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy.map((item, i) => ({ ...item, sortOrder: i }));
}

function ReorderButtons({ index, length, onMove }) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
        className="w-6 h-5 flex items-center justify-center text-text-muted hover:text-accent-yellow disabled:opacity-25 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer text-xs leading-none"
        title="انتقال به بالا"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={index === length - 1}
        onClick={() => onMove(index, 1)}
        className="w-6 h-5 flex items-center justify-center text-text-muted hover:text-accent-yellow disabled:opacity-25 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer text-xs leading-none"
        title="انتقال به پایین"
      >
        ▼
      </button>
    </div>
  );
}

function RowShell({ children, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 bg-bg-base border border-border-default rounded-lg p-3">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          ویرایش
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-400 border border-red-400/25 bg-red-400/5 hover:bg-red-400/15 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          حذف
        </button>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'features',   label: '✦ امکانات' },
  { id: 'faqs',       label: '✦ سوالات متداول' },
  { id: 'stats',      label: '✦ آمار نمایشی' },
  { id: 'changelogs', label: '✦ تغییرات نسخه' },
];

export default function AdminProductContentManager({ product, onClose, showToast }) {
  const [tab, setTab] = useState('features');

  return (
    <Modal title={`محتوای صفحه: ${product.name}`} onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex flex-wrap gap-2 mb-5 border-b border-border-default pb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-bold border cursor-pointer transition-colors ${
              tab === t.id
                ? 'grad-bg text-[#111] border-transparent'
                : 'text-text-secondary border-border-default bg-bg-card hover:text-accent-yellow'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'features'   && <FeaturesTab   product={product} showToast={showToast} />}
      {tab === 'faqs'       && <FaqsTab       product={product} showToast={showToast} />}
      {tab === 'stats'      && <StatsTab      product={product} showToast={showToast} />}
      {tab === 'changelogs' && <ChangelogsTab product={product} showToast={showToast} />}
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Features
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_FEATURE = { icon: '', title: '', value: '', sortOrder: 0 };

function FeatureForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FEATURE);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) { alert('عنوان الزامی است'); return; }
    onSave({ ...form, value: form.value || null });
  };

  return (
    <div className="flex flex-col gap-3 bg-bg-base border border-border-default rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="آیکون (اموجی)">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🎨" />
        </FormField>
        <FormField label="عنوان" required>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="دموی آماده" />
        </FormField>
        <FormField label="مقدار" hint="اختیاری">
          <Input value={form.value || ''} onChange={e => set('value', e.target.value)} placeholder="+140" />
        </FormField>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">انصراف</button>
        <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}ذخیره
        </button>
      </div>
    </div>
  );
}

function FeaturesTab({ product, showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(null); // null | {} | item
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getProductFeatures(product.id);
      const data = (res.data || res.features || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminApi.updateProductFeature(product.id, editing.id, data);
        showToast('امکان بروزرسانی شد');
      } else {
        await adminApi.createProductFeature(product.id, { ...data, sortOrder: items.length });
        showToast('امکان اضافه شد');
      }
      setEditing(null);
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
      await adminApi.deleteProductFeature(product.id, deleteItem.id);
      showToast('امکان حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index, dir) => {
    const reordered = moveItem(items, index, dir);
    if (reordered === items) return;
    setItems(reordered);
    try {
      await adminApi.reorderProductFeatures(product.id, reordered.map(it => ({ id: it.id, sortOrder: it.sortOrder })));
    } catch (e) {
      showToast(e.message, 'error');
      load();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">ویژگی‌های کلیدی محصول (مثل «+140 دمو»)</p>
        {!editing && (
          <button onClick={() => setEditing({})} className="text-xs font-bold text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
            + افزودن امکان
          </button>
        )}
      </div>

      {editing && (
        <FeatureForm
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading && <div className="text-center py-8 text-text-muted text-sm flex items-center justify-center gap-2"><Spinner /> در حال بارگذاری…</div>}
      {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && !editing && (
        <EmptyState icon="✦" title="امکانی ثبت نشده" description="برای این محصول هنوز امکانی اضافه نشده است" />
      )}

      {!loading && items.map((item, i) => (
        <RowShell key={item.id} onEdit={() => setEditing(item)} onDelete={() => setDeleteItem(item)}>
          <div className="flex items-center gap-2">
            <ReorderButtons index={i} length={items.length} onMove={handleMove} />
            {item.icon && <span className="text-lg">{item.icon}</span>}
            <span className="text-text-primary text-sm font-medium">{item.title}</span>
            {item.value && <span className="grad-text font-bold text-sm">{item.value}</span>}
          </div>
        </RowShell>
      ))}

      {deleteItem && (
        <ConfirmDialog
          title="حذف امکان"
          description={`آیا از حذف «${deleteItem.title}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FAQs
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_FAQ = { question: '', answer: '', sortOrder: 0 };

function FaqForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FAQ);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.question.trim()) { alert('سوال الزامی است'); return; }
    if (!form.answer.trim())   { alert('پاسخ الزامی است'); return; }
    onSave(form);
  };

  return (
    <div className="flex flex-col gap-3 bg-bg-base border border-border-default rounded-lg p-4">
      <FormField label="سوال" required hint="حداکثر ۵۰۰ کاراکتر">
        <Input value={form.question} onChange={e => set('question', e.target.value)} placeholder="نصب چقدر طول می‌کشد؟" />
      </FormField>
      <FormField label="پاسخ" required hint="حداکثر ۳۰۰۰ کاراکتر">
        <Textarea value={form.answer} onChange={e => set('answer', e.target.value)} placeholder="پاسخ کامل…" />
      </FormField>
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">انصراف</button>
        <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}ذخیره
        </button>
      </div>
    </div>
  );
}

function FaqsTab({ product, showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getProductFaqs(product.id);
      const data = (res.data || res.faqs || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminApi.updateProductFaq(product.id, editing.id, data);
        showToast('سوال بروزرسانی شد');
      } else {
        await adminApi.createProductFaq(product.id, { ...data, sortOrder: items.length });
        showToast('سوال اضافه شد');
      }
      setEditing(null);
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
      await adminApi.deleteProductFaq(product.id, deleteItem.id);
      showToast('سوال حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index, dir) => {
    const reordered = moveItem(items, index, dir);
    if (reordered === items) return;
    setItems(reordered);
    try {
      await adminApi.reorderProductFaqs(product.id, reordered.map(it => ({ id: it.id, sortOrder: it.sortOrder })));
    } catch (e) {
      showToast(e.message, 'error');
      load();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">سوالات متداول مرتبط با این محصول</p>
        {!editing && (
          <button onClick={() => setEditing({})} className="text-xs font-bold text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
            + افزودن سوال
          </button>
        )}
      </div>

      {editing && (
        <FaqForm
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading && <div className="text-center py-8 text-text-muted text-sm flex items-center justify-center gap-2"><Spinner /> در حال بارگذاری…</div>}
      {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && !editing && (
        <EmptyState icon="❓" title="سوالی ثبت نشده" description="برای این محصول هنوز FAQ اضافه نشده است" />
      )}

      {!loading && items.map((item, i) => (
        <RowShell key={item.id} onEdit={() => setEditing(item)} onDelete={() => setDeleteItem(item)}>
          <div className="flex items-start gap-2">
            <ReorderButtons index={i} length={items.length} onMove={handleMove} />
            <div className="min-w-0">
              <p className="text-text-primary text-sm font-bold mb-1">{item.question}</p>
              <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{item.answer}</p>
            </div>
          </div>
        </RowShell>
      ))}

      {deleteItem && (
        <ConfirmDialog
          title="حذف سوال"
          description={`آیا از حذف این سوال مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Stats
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_STAT = { icon: '', label: '', value: '', sortOrder: 0 };

function StatForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_STAT);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.label.trim()) { alert('برچسب الزامی است'); return; }
    if (!form.value.trim()) { alert('مقدار الزامی است'); return; }
    onSave(form);
  };

  return (
    <div className="flex flex-col gap-3 bg-bg-base border border-border-default rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="آیکون (اموجی)">
          <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🛒" />
        </FormField>
        <FormField label="برچسب" required>
          <Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="تعداد فروش" />
        </FormField>
        <FormField label="مقدار" required>
          <Input value={form.value} onChange={e => set('value', e.target.value)} placeholder="368" />
        </FormField>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">انصراف</button>
        <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}ذخیره
        </button>
      </div>
    </div>
  );
}

function StatsTab({ product, showToast }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getProductStats(product.id);
      const data = (res.data || res.stats || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminApi.updateProductStat(product.id, editing.id, data);
        showToast('آمار بروزرسانی شد');
      } else {
        await adminApi.createProductStat(product.id, { ...data, sortOrder: items.length });
        showToast('آمار اضافه شد');
      }
      setEditing(null);
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
      await adminApi.deleteProductStat(product.id, deleteItem.id);
      showToast('آمار حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index, dir) => {
    const reordered = moveItem(items, index, dir);
    if (reordered === items) return;
    setItems(reordered);
    try {
      await adminApi.reorderProductStats(product.id, reordered.map(it => ({ id: it.id, sortOrder: it.sortOrder })));
    } catch (e) {
      showToast(e.message, 'error');
      load();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">اعداد و ارقام جذاب نمایش‌داده‌شده در صفحه محصول</p>
        {!editing && (
          <button onClick={() => setEditing({})} className="text-xs font-bold text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
            + افزودن آمار
          </button>
        )}
      </div>

      {editing && (
        <StatForm
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading && <div className="text-center py-8 text-text-muted text-sm flex items-center justify-center gap-2"><Spinner /> در حال بارگذاری…</div>}
      {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && !editing && (
        <EmptyState icon="📊" title="آماری ثبت نشده" description="برای این محصول هنوز آماری اضافه نشده است" />
      )}

      {!loading && items.map((item, i) => (
        <RowShell key={item.id} onEdit={() => setEditing(item)} onDelete={() => setDeleteItem(item)}>
          <div className="flex items-center gap-2">
            <ReorderButtons index={i} length={items.length} onMove={handleMove} />
            {item.icon && <span className="text-lg">{item.icon}</span>}
            <span className="grad-text font-bold text-sm">{item.value}</span>
            <span className="text-text-secondary text-sm">{item.label}</span>
          </div>
        </RowShell>
      ))}

      {deleteItem && (
        <ConfirmDialog
          title="حذف آمار"
          description={`آیا از حذف «${deleteItem.label}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Changelogs
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_CHANGELOG = { version: '', title: '', changes: [''], releasedAt: '' };

function ChangelogForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, changes: initial.changes?.length ? initial.changes : [''], releasedAt: initial.releasedAt ? initial.releasedAt.slice(0, 10) : '' }
      : EMPTY_CHANGELOG
  );
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const setChange = (i, v) => {
    const changes = [...form.changes];
    changes[i] = v;
    set('changes', changes);
  };
  const addChange = () => set('changes', [...form.changes, '']);
  const removeChange = (i) => set('changes', form.changes.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!form.version.trim()) { alert('شماره نسخه الزامی است'); return; }
    const changes = form.changes.map(c => c.trim()).filter(Boolean);
    if (changes.length === 0) { alert('حداقل یک تغییر باید ثبت شود'); return; }
    onSave({
      version: form.version.trim(),
      title: form.title?.trim() || null,
      changes,
      releasedAt: form.releasedAt || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-bg-base border border-border-default rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="شماره نسخه" required hint="مثال: ۵.۵">
          <Input value={form.version} onChange={e => set('version', e.target.value)} placeholder="5.5" dir="ltr" />
        </FormField>
        <FormField label="عنوان نسخه" hint="اختیاری">
          <Input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="بهبود تنظیمات ادمین" />
        </FormField>
        <FormField label="تاریخ انتشار" hint="اختیاری — پیش‌فرض اکنون">
          <Input type="date" value={form.releasedAt} onChange={e => set('releasedAt', e.target.value)} dir="ltr" />
        </FormField>
      </div>

      <FormField label="تغییرات" required hint="هر آیتم یک خط — حداقل یک مورد">
        <div className="flex flex-col gap-2">
          {form.changes.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-accent-yellow text-sm flex-shrink-0">✓</span>
              <Input value={c} onChange={e => setChange(i, e.target.value)} placeholder="رفع باگ لایسنس" />
              {form.changes.length > 1 && (
                <button type="button" onClick={() => removeChange(i)} className="text-red-400 bg-transparent border-none cursor-pointer text-sm px-1">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addChange} className="self-start text-xs text-accent-yellow bg-transparent border-none cursor-pointer hover:underline">
            + افزودن مورد دیگر
          </button>
        </div>
      </FormField>

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-default hover:bg-white/5 bg-transparent cursor-pointer transition-colors">انصراف</button>
        <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />}ذخیره
        </button>
      </div>
    </div>
  );
}

function ChangelogsTab({ product, showToast }) {
  const [items, setItems]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getProductChangelogs(product.id, { page, limit: 10 });
      setItems(res.data || res.changelogs || []);
      setPagination(res.pagination || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [product.id, page]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing?.id) {
        await adminApi.updateProductChangelog(product.id, editing.id, data);
        showToast('نسخه بروزرسانی شد');
      } else {
        await adminApi.createProductChangelog(product.id, data);
        showToast('نسخه جدید ثبت شد');
      }
      setEditing(null);
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
      await adminApi.deleteProductChangelog(product.id, deleteItem.id);
      showToast('نسخه حذف شد');
      setDeleteItem(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-xs">تاریخچه بروزرسانی‌ها — رکوردهای تاریخی، هیچ‌وقت bulk حذف نمی‌شوند</p>
        {!editing && (
          <button onClick={() => setEditing({})} className="text-xs font-bold text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
            + ثبت نسخه جدید
          </button>
        )}
      </div>

      {editing && (
        <ChangelogForm
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading && <div className="text-center py-8 text-text-muted text-sm flex items-center justify-center gap-2"><Spinner /> در حال بارگذاری…</div>}
      {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && !editing && (
        <EmptyState icon="🕒" title="تاریخچه‌ای ثبت نشده" description="برای این محصول هنوز نسخه‌ای ثبت نشده است" />
      )}

      {!loading && items.map(item => (
        <RowShell key={item.id} onEdit={() => setEditing(item)} onDelete={() => setDeleteItem(item)}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge color="yellow">نسخه {item.version}</Badge>
              {item.title && <span className="text-text-primary text-sm font-bold">{item.title}</span>}
              {item.releasedAt && (
                <span className="text-text-muted text-xs mr-auto">
                  {new Date(item.releasedAt).toLocaleDateString('fa-IR')}
                </span>
              )}
            </div>
            {item.changes?.length > 0 && (
              <ul className="flex flex-col gap-0.5">
                {item.changes.map((c, i) => (
                  <li key={i} className="text-text-muted text-xs flex gap-1.5">
                    <span className="text-accent-yellow">✓</span>{c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </RowShell>
      ))}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-yellow/30 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer transition-colors"
          >قبلی</button>
          <span className="text-sm text-text-muted px-2">صفحه {page} از {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-yellow/30 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer transition-colors"
          >بعدی</button>
        </div>
      )}

      {deleteItem && (
        <ConfirmDialog
          title="حذف نسخه"
          description={`آیا از حذف نسخه «${deleteItem.version}» مطمئنید؟`}
          confirmLabel="حذف"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  );
}
