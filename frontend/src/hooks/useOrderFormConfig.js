// src/hooks/useOrderFormConfig.js
//
// داده‌های فرم ثبت سفارش را از بک‌اند می‌گیرد (دسته‌بندی، زیردسته، بودجه، زمانبندی)
// به‌جای siteData محلی — تا ادمین بتواند همه چیز را از پنل مدیریت کنترل کند.

import { useState, useEffect } from 'react';
import { orderConfigApi } from '../services/api';

export function useOrderFormConfig() {
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories,  setSubcategories]  = useState([]);
  const [budgetOptions,  setBudgetOptions]  = useState([]);
  const [timelineOptions,setTimelineOptions]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        setLoading(true);
        setError(null);

        const res = await orderConfigApi.getOptions();
        if (cancelled) return;

        const { mainCategories, subcategories, budgetOptions, timelineOptions } = res.data;
        setMainCategories(mainCategories ?? []);
        setSubcategories(subcategories   ?? []);
        setBudgetOptions(budgetOptions   ?? []);
        setTimelineOptions(timelineOptions ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'خطا در دریافت گزینه‌های فرم');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchConfig();
    return () => { cancelled = true; };
  }, []);

  // ساختار سازگار با کد قبلی: هر دسته + زیردسته‌هایش به‌صورت nested
  const categoriesWithSubtypes = mainCategories.map(cat => ({
    ...cat,
    // label برای سازگاری — بک‌اند «title» برمی‌گرداند
    label: cat.title,
    subtypes: subcategories.filter(sub => sub.mainCategoryId === cat.id),
  }));

  return {
    mainCategories,
    subcategories,
    budgetOptions,
    timelineOptions,
    // nested — مستقیم قابل استفاده در OrderPage
    categoriesWithSubtypes,
    loading,
    error,
  };
}