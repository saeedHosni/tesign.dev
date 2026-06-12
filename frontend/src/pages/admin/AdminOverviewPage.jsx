// src/pages/admin/AdminOverviewPage.jsx
import { useState, useEffect } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import { Card, StatCard, LoadingState, ErrorState, Badge, Table, Tr, Td } from './AdminUI';
import { adminApi } from '../../services/api';

const toFarsi = (n) => Number(n || 0).toLocaleString('fa-IR');
const toPrice = (n) => Number(n || 0).toLocaleString('fa-IR') + ' تومان';

function RecentOrders({ orders = [] }) {
  const statusMap = {
    PENDING:   { label: 'در انتظار',   color: 'yellow' },
    PAID:      { label: 'پرداخت شده',  color: 'green'  },
    FAILED:    { label: 'ناموفق',       color: 'red'    },
    CANCELLED: { label: 'لغو شده',     color: 'red'    },
  };
  return (
    <Card>
      <h3 className="font-bold text-text-primary mb-4 text-sm">آخرین سفارشات</h3>
      {orders.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-6">سفارشی ثبت نشده</p>
      ) : (
        <Table columns={[
          { label: 'شماره' },
          { label: 'کاربر' },
          { label: 'مبلغ' },
          { label: 'وضعیت' },
        ]}>
          {orders.map(o => {
            const s = statusMap[o.paymentStatus] || { label: o.paymentStatus, color: 'gray' };
            return (
              <Tr key={o.id}>
                <Td><span className="text-accent-yellow font-mono text-xs">{o.orderNumber || o.id?.slice(0,8)}</span></Td>
                <Td><span className="text-text-primary text-xs">{o.user?.name || '—'}</span></Td>
                <Td><span className="text-text-primary text-xs">{toPrice(o.finalAmount)}</span></Td>
                <Td><Badge color={s.color}>{s.label}</Badge></Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </Card>
  );
}

function MiniBarChart({ data = [] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <Card>
      <h3 className="font-bold text-text-primary mb-4 text-sm">درآمد اخیر</h3>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full rounded-t-md bg-accent-yellow/20 group-hover:bg-accent-yellow/40 transition-colors relative"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px' }}
              title={toPrice(d.value)}
            />
            <span className="text-[0.6rem] text-text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats]     = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [s, a] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAnalytics().catch(() => null),
      ]);
      setStats(s.data || s);
      setAnalytics(a?.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <AdminPageHeader title="نمای کلی" description="خلاصه وضعیت سایت" />

      {loading && <LoadingState label="در حال بارگذاری آمار…" />}
      {error   && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && stats && (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="کاربران"        value={toFarsi(stats.totalUsers)}    accent="blue"   />
            <StatCard icon="💳" label="سفارشات موفق"   value={toFarsi(stats.totalOrders)}   accent="green"  />
            <StatCard icon="💰" label="درآمد کل"       value={toPrice(stats.totalRevenue)}  accent="yellow" />
            <StatCard icon="📦" label="محصولات فعال"   value={toFarsi(stats.totalProducts)} accent="orange" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📝" label="درخواست‌های جدید" value={toFarsi(stats.newLeads)}       accent="purple" />
            <StatCard icon="⭐" label="نظرات در انتظار"   value={toFarsi(stats.pendingReviews)} accent="orange" />
          </div>

          {/* Chart + recent orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics?.monthly ? (
              <MiniBarChart data={analytics.monthly.map(m => ({ label: m.month, value: m.revenue }))} />
            ) : (
              <Card className="flex items-center justify-center h-44">
                <p className="text-text-muted text-sm">داده نمودار موجود نیست</p>
              </Card>
            )}
            <RecentOrders orders={stats.recentOrders || []} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
