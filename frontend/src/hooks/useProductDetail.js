// src/hooks/useProductDetail.js
// جزئیات یک محصول: اول از API، اگر جواب نداد از siteData
import { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/siteData';

const toFarsiPrice = (num) => Number(num).toLocaleString('fa-IR');

const THUMB_CLASSES = ['product-thumb-1', 'product-thumb-2', 'product-thumb-3', 'product-thumb-4'];
const BADGE_MAP = { bestseller: 'پرفروش', new: 'جدید', featured: 'پیشنهادی' };

function normalizeProduct(p, index = 0) {
  return {
    id:          p.id,
    icon:        p.icon || '⚡',
    thumbLabel:  p.category?.name || p.categoryName || p.category || '',
    thumbClass:  THUMB_CLASSES[index % THUMB_CLASSES.length],
    badge:       BADGE_MAP[p.badge] || (p.isFeatured ? 'پیشنهادی' : null),
    category:    p.category?.name || p.categoryName || p.category || '',
    name:        p.name,
    sub:         p.subtitle || p.sub || '',
    description: p.description || '',
    price:       typeof p.price === 'number' ? toFarsiPrice(p.price) : (p.price || ''),
    priceNum:    typeof p.price === 'number' ? p.price : p.priceNum,
    comparePrice: p.comparePrice || null,
    slug:        p.slug,
    tags:        p.tags || [],
    rating:      p.rating || 0,
    reviewCount: p.reviewCount || 0,
    totalSales:  p.totalSales || 0,
    stock:       p.stock,
    features:    p.features || [],
    faqs:        p.faqs || [],
    changelogs:  p.changelogs || [],
    stats:       p.stats || [],
  };
}

export function useProductDetail(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const res = await productApi.getBySlug(slug);
        if (cancelled) return;
        if (res?.success && res?.data) {
          setProduct(normalizeProduct(res.data, 0));
        } else {
          throw new Error('not found');
        }
      } catch {
        if (cancelled) return;
        // Fallback to siteData
        const found = FALLBACK_PRODUCTS.find(p => p.slug === slug);
        if (found) {
          setProduct(normalizeProduct(found, FALLBACK_PRODUCTS.indexOf(found)));
        } else {
          setError('محصول یافت نشد');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { product, loading, error };
}
