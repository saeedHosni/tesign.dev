// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/siteData';

// Persian number formatter
const toFarsiPrice = (num) =>
  Number(num).toLocaleString('fa-IR');

// CSS class cycling for thumbnails (matches existing Tailwind classes)
const THUMB_CLASSES = [
  'product-thumb-1',
  'product-thumb-2',
  'product-thumb-3',
  'product-thumb-4',
];

const BADGE_MAP = {
  bestseller: 'پرفروش',
  new:        'جدید',
  featured:   'پیشنهادی',
};

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await productApi.getAll(params);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((p, i) => ({
            id:          p.id,
            icon:        p.icon || '⚡',
            thumbLabel:  p.category?.name || p.categoryName || '',
            thumbClass:  THUMB_CLASSES[i % THUMB_CLASSES.length],
            badge:       BADGE_MAP[p.badge] || (p.isFeatured ? 'پیشنهادی' : null),
            category:    p.category?.name || p.categoryName || '',
            name:        p.name,
            sub:         p.subtitle || '',
            price:       toFarsiPrice(p.price),
            priceNum:    p.price,
            delay:       i > 0 ? `reveal-delay-${i % 4}` : '',
            slug:        p.slug,
            tags:        p.tags || [],
          }));
          setProducts(normalized);
        } else {
          // Backend returned empty or failed — use fallback
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch {
        if (!cancelled) {
          // Backend not reachable — silently use fallback
          setProducts(FALLBACK_PRODUCTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { products, loading, error };
}
