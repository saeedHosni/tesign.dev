// src/pages/admin/AdminOrdersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import AdminLayout, { AdminPageHeader } from './AdminLayout';
import {
  Card, LoadingState, ErrorState, EmptyState, Badge,
  Table, Tr, Td, Pagination, Modal, Toast, ConfirmDialog,
} from './AdminUI';
import { adminApi } from '../../services/api';

const STATUS_MAP = {
  PENDING:    { label: 'در انتظار پرداخت', color: 'yellow' },
  PAID:       { label: 'پرداخت شده',        color: 'green'  },
  FAILED:     { label: 'ناموفق',             color: 'red'    },
  CANCELLED:  { label: 'لغو شده',           color: 'red'    },
  REFUNDED:   { label: 'مسترد شده',         color: 'blue'   },
};

const toPrice = (n) => Number(n || 0).toLocaleString('fa-IR') + ' تومان';
const toDate  = (d) => d ? new Date(d).toLocaleDateString('fa-IR') : '—';

function OrderDetailModal({ order, onClose, onConfirm, confirming }) {
  if (!order) return null;
  const s = STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: 'gray' };
  return (
    <Modal title={`سفارش ${order.orderNumber || order.id?.slice(0,8)}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">

        {/* Header info */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-text-muted text-xs">تاریخ ثبت</p>
            <p className="text-text-primary text-sm font-medium">{toDate(order.createdAt)}</p>
          </div>
          <Badge color={s.color}>{s.label}</Badge>
        </div>

        {/* User */}
        <div className="bg-bg-base rounded-xl p-4 flex flex-col gap-1">
          <p className="text-text-muted text-xs mb-1">مشتری</p>
          <p className="text-text-primary text-sm font-bold">{order.user?.name || '—'}</p>
          <p className="text-text-muted text-xs">{order.user?.email || '—'}</p>
        </div>

        {/* Items */}
        <div>
          <p className="text-text-muted text-xs mb-2">آیتم‌های سفارش</p>
          <div className="flex flex-col gap-2">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-bg-base rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.product?.icon || '📦'}</span>
                  <p className="text-text-primary text-sm">{item.product?.name || item.name || '—'}</p>
                  <span className="text-text-muted text-xs">× {item.quantity}</span>
                </div>
                <span className="text-text-secondary text-sm">{toPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex flex-col gap-1 bg-bg-base rounded-xl p-4">
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">تخفیف</span>
              <span className="text-green-400">- {toPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-border-default">
            <span className="text-text-primary">مبلغ نهایی</span>
            <span className="text-accent-yellow">{toPrice(order.finalAmount)}</span>
          </div>
        </div>

        {/* Confirm button */}
        {order.paymentStatus === 'PENDING' && (
          <button
            onClick={() => onConfirm(order.id)}
            disabled={confirming}
            className="w-full py-2.5 rounded-lg text-sm font-bold grad-bg text-[#111] border-none cursor-pointer disabled:opacity-60"
          >
            {confirming ? 'در حال تأیید…' : '✓ تأیید پرداخت'}
          </button>
        )}
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const [orders,    setOrders]    = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [status,    setStatus]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [confirming,setConfirming]= useState(false);
  const [toast,     setToast]     = useState(null);

  const PER_PAGE = 15;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getAllOrders({ page, limit: PER_PAGE, status: status || undefined });
      setOrders(res.data || res.orders || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (id) => {
    setConfirming(true);
    try {
      await adminApi.confirmOrder(id);
      showToast('پرداخت تأیید شد');
      setSelected(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setConfirming(false);
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="سفارشات"
        description={`${total.toLocaleString('fa-IR')} سفارش`}
      />

      <Card>
        {/* Filters */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
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

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && orders.length === 0 && (
          <EmptyState icon="💳" title="سفارشی یافت نشد" />
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <Table columns={[
              { label: 'شماره' },
              { label: 'کاربر' },
              { label: 'مبلغ' },
              { label: 'تاریخ' },
              { label: 'وضعیت' },
              { label: 'جزئیات', className: 'text-center' },
            ]}>
              {orders.map(o => {
                const s = STATUS_MAP[o.paymentStatus] || { label: o.paymentStatus, color: 'gray' };
                return (
                  <Tr key={o.id}>
                    <Td><span className="text-accent-yellow font-mono text-xs">{o.orderNumber || o.id?.slice(0,8)}</span></Td>
                    <Td>
                      <div>
                        <p className="text-text-primary text-sm">{o.user?.name || '—'}</p>
                        <p className="text-text-muted text-xs">{o.user?.email || ''}</p>
                      </div>
                    </Td>
                    <Td><span className="text-text-primary text-sm font-medium">{toPrice(o.finalAmount)}</span></Td>
                    <Td><span className="text-text-secondary text-xs">{toDate(o.createdAt)}</span></Td>
                    <Td><Badge color={s.color}>{s.label}</Badge></Td>
                    <Td className="text-center">
                      <button
                        onClick={() => setSelected(o)}
                        className="text-xs text-text-secondary border border-border-default hover:text-text-primary hover:border-white/20 px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-transparent"
                      >
                        مشاهده
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

      <OrderDetailModal
        order={selected}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
        confirming={confirming}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AdminLayout>
  );
}
