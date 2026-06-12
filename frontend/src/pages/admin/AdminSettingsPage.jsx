// src/pages/admin/AdminSettingsPage.jsx
import { useState, useEffect } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, Toast, Spinner, FormField, Input, Textarea,
} from './AdminUI';
import { adminApi } from '../../services/api';

// ── Ticker section ────────────────────────────────────────────────────────────

function TickerSection() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    adminApi.getSettings()
      .then(res => {
        // Ticker comes from /settings/public endpoint
        return adminApi.getDashboardStats ? null : null;
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load ticker from public settings
    import('../../services/api').then(({ settingsApi }) => {
      settingsApi.getPublic().then(res => {
        const d = res?.data || res;
        setItems((d.ticker || []).map((t, i) => typeof t === 'string' ? { text: t, isActive: true, sortOrder: i } : t));
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const addItem  = () => setItems(p => [...p, { text: '', isActive: true, sortOrder: p.length }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, text) => setItems(p => p.map((item, idx) => idx === i ? { ...item, text } : item));
  const toggleItem = (i) => setItems(p => p.map((item, idx) => idx === i ? { ...item, isActive: !item.isActive } : item));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateTicker(items.filter(t => t.text.trim()));
      showToast('تیکر ذخیره شد');
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="بارگذاری تیکر…" />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">متن‌های تیکر</h3>
        <button onClick={addItem} className="text-xs text-accent-yellow border border-accent-yellow/25 bg-accent-yellow/5 hover:bg-accent-yellow/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
          + افزودن
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4 max-h-72 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-text-muted text-sm text-center py-4">هنوز متنی اضافه نشده</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.isActive}
              onChange={() => toggleItem(i)}
              className="accent-[#F5C518] w-4 h-4 flex-shrink-0 cursor-pointer"
            />
            <input
              value={item.text}
              onChange={e => updateItem(i, e.target.value)}
              placeholder="متن تیکر…"
              className="flex-1 px-3 py-2 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
            />
            <button onClick={() => removeItem(i)} className="text-red-400/60 hover:text-red-400 bg-transparent border-none cursor-pointer text-xl leading-none flex-shrink-0">×</button>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="grad-bg text-[#111] font-bold text-sm px-5 py-2 rounded-lg border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
        {saving && <Spinner size={4} />} ذخیره تیکر
      </button>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </Card>
  );
}

// ── Site Stats section ────────────────────────────────────────────────────────

function StatsSection() {
  const [stats,   setStats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    import('../../services/api').then(({ settingsApi }) => {
      settingsApi.getPublic().then(res => {
        const d = res?.data || res;
        setStats(d.stats || []);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const updateStat = (i, key, val) => setStats(p => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateStats(stats);
      showToast('آمار ذخیره شد');
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="بارگذاری آمار…" />;

  return (
    <Card>
      <h3 className="font-bold text-text-primary mb-4">آمار صفحه اصلی</h3>
      <div className="flex flex-col gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-base rounded-xl p-3">
            <FormField label="عنوان">
              <input value={s.label || ''} onChange={e => updateStat(i, 'label', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors" />
            </FormField>
            <FormField label={s.isStatic ? 'متن ثابت' : 'مقدار عددی'}>
              <input
                value={s.isStatic ? (s.staticValue || '') : (s.value || '')}
                onChange={e => updateStat(i, s.isStatic ? 'staticValue' : 'value', s.isStatic ? e.target.value : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
                dir="ltr"
              />
            </FormField>
            <FormField label="پسوند">
              <input value={s.suffix || ''} onChange={e => updateStat(i, 'suffix', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-yellow/60 transition-colors" />
            </FormField>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                <input type="checkbox" checked={!!s.isStatic} onChange={e => updateStat(i, 'isStatic', e.target.checked)}
                  className="accent-[#F5C518] w-4 h-4 cursor-pointer" />
                متن ثابت
              </label>
            </div>
          </div>
        ))}
        {stats.length === 0 && <p className="text-text-muted text-sm text-center py-4">آماری تعریف نشده</p>}
      </div>
      <button onClick={save} disabled={saving}
        className="grad-bg text-[#111] font-bold text-sm px-5 py-2 rounded-lg border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
        {saving && <Spinner size={4} />} ذخیره آمار
      </button>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </Card>
  );
}

// ── General Settings section ──────────────────────────────────────────────────

function GeneralSettingsSection() {
  const [settings, setSettings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    adminApi.getSettings()
      .then(res => setSettings(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key, value) => setSettings(p => p.map(s => s.key === key ? { ...s, value } : s));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings.map(({ key, value, group }) => ({ key, value, group })));
      showToast('تنظیمات ذخیره شد');
    } catch (e) { showToast(e.message, 'error'); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="بارگذاری تنظیمات…" />;

  // Group settings
  const groups = settings.reduce((acc, s) => {
    const g = s.group || 'عمومی';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  if (Object.keys(groups).length === 0) return (
    <Card>
      <p className="text-text-muted text-sm text-center py-6">تنظیماتی در دیتابیس یافت نشد</p>
    </Card>
  );

  return (
    <Card>
      <div className="flex flex-col gap-6">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{group}</h4>
            <div className="flex flex-col gap-3">
              {items.map(s => (
                <FormField key={s.key} label={s.key}>
                  {(s.value || '').length > 80 ? (
                    <Textarea value={s.value || ''} onChange={e => updateSetting(s.key, e.target.value)} />
                  ) : (
                    <Input value={s.value || ''} onChange={e => updateSetting(s.key, e.target.value)} dir="ltr" />
                  )}
                </FormField>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border-default">
        <button onClick={save} disabled={saving}
          className="grad-bg text-[#111] font-bold text-sm px-5 py-2 rounded-lg border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
          {saving && <Spinner size={4} />} ذخیره تنظیمات
        </button>
      </div>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </Card>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'general', label: 'تنظیمات عمومی' },
  { id: 'ticker',  label: 'تیکر'           },
  { id: 'stats',   label: 'آمار هیرو'      },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('general');

  return (
    <AdminLayout>
      <AdminPageHeader title="تنظیمات سایت" description="مدیریت محتوا و تنظیمات" />

      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-6 border-b border-border-default pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm font-medium px-4 py-2.5 border-b-2 transition-colors cursor-pointer bg-transparent -mb-px ${
              tab === t.id
                ? 'border-accent-yellow text-accent-yellow'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralSettingsSection />}
      {tab === 'ticker'  && <TickerSection />}
      {tab === 'stats'   && <StatsSection />}
    </AdminLayout>
  );
}
