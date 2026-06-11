// src/context/CartContext.jsx
// سبد خرید: اول از API، اگر جواب نداد از localStorage
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';

const CartContext = createContext(null);

const LS_KEY = 'tesign_cart';

// ── helpers ──────────────────────────────────────────────────────────────────

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

// Normalize backend cart item → shape used throughout the app
function normalizeItem(item) {
  return {
    itemId:   item.id,
    id:       item.productId || item.product?.id,
    slug:     item.product?.slug,
    name:     item.product?.name || item.name,
    icon:     item.product?.icon || item.icon || '⚡',
    price:    item.product?.price ?? item.price,
    quantity: item.quantity,
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [useBackend, setUseBackend] = useState(true); // assumed true until fails

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem('tesign_token');
    if (!token) {
      setItems(loadLocal());
      setUseBackend(false);
      return;
    }
    setLoading(true);
    cartApi.get()
      .then(res => {
        if (res?.data?.items) {
          setItems(res.data.items.map(normalizeItem));
        }
      })
      .catch(() => {
        setItems(loadLocal());
        setUseBackend(false);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── add ───────────────────────────────────────────────────────────────────

  const addItem = useCallback(async (product, quantity = 1) => {
    if (useBackend) {
      try {
        const res = await cartApi.add(product.id, quantity);
        if (res?.data?.items) {
          setItems(res.data.items.map(normalizeItem));
          return;
        }
      } catch {
        setUseBackend(false);
      }
    }

    // Local fallback
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      let next;
      if (existing) {
        next = prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        next = [...prev, {
          itemId:   `local-${Date.now()}`,
          id:       product.id,
          slug:     product.slug,
          name:     product.name,
          icon:     product.icon || '⚡',
          price:    product.priceNum ?? product.price,
          quantity,
        }];
      }
      saveLocal(next);
      return next;
    });
  }, [useBackend]);

  // ── update qty ────────────────────────────────────────────────────────────

  const updateItem = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;

    if (useBackend) {
      try {
        const res = await cartApi.update(itemId, quantity);
        if (res?.data?.items) {
          setItems(res.data.items.map(normalizeItem));
          return;
        }
      } catch {
        setUseBackend(false);
      }
    }

    setItems(prev => {
      const next = prev.map(i => i.itemId === itemId ? { ...i, quantity } : i);
      saveLocal(next);
      return next;
    });
  }, [useBackend]);

  // ── remove ────────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (itemId) => {
    if (useBackend) {
      try {
        const res = await cartApi.remove(itemId);
        if (res?.data?.items) {
          setItems(res.data.items.map(normalizeItem));
          return;
        }
      } catch {
        setUseBackend(false);
      }
    }

    setItems(prev => {
      const next = prev.filter(i => i.itemId !== itemId);
      saveLocal(next);
      return next;
    });
  }, [useBackend]);

  // ── clear ─────────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    if (useBackend) {
      try {
        await cartApi.clear();
      } catch {
        setUseBackend(false);
      }
    }
    setItems([]);
    saveLocal([]);
  }, [useBackend]);

  // ── derived ───────────────────────────────────────────────────────────────

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading,
      addItem, updateItem, removeItem, clearCart,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
