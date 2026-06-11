// src/data/siteData.js

export const NAV_LINKS = [
  { href: '/',         label: 'خانه',       page: true },
  { href: '/services', label: 'خدمات',      page: true },
  { href: '/shop',     label: 'فروشگاه',    page: true },
  { href: '/order',    label: 'ثبت سفارش',  page: true },
  { href: '/about',    label: 'درباره ما',   page: true },
];

export const TICKER_ITEMS = [
  'طراحی وب‌سایت حرفه‌ای',
  'UI/UX و هویت بصری',
  'بهینه‌سازی موتور جستجو',
  'فروشگاه اینترنتی',
  'قالب‌های آماده وردپرس',
  'طراحی لوگو و برندینگ',
  'پشتیبانی و نگهداری سایت',
  'طراحی فیگما',
  'افزایش سرعت سایت',
];

export const HERO_STATS = [
  { num: 120, suffix: '', label: 'پروژه موفق' },
  { num: 50,  suffix: '', label: 'مشتری راضی' },
  { num: null, static: '۵ ⭐', label: 'میانگین رتبه' },
];

export const SERVICES = [
  {
    icon: '🌐',
    slug: 'web-development',
    cat: 'توسعه',
    title: 'توسعه وب‌سایت',
    desc: 'ساخت وب‌سایت‌های سریع، امن و حرفه‌ای با فناوری‌های روز دنیا، سفارشی‌سازی‌شده برای اهداف شما.',
    items: [
      'وب‌سایت شرکتی و سازمانی',
      'وب‌سایت شخصی و پورتفولیو',
      'فروشگاه اینترنتی (ووکامرس)',
      'لندینگ‌پیج تبلیغاتی',
    ],
    linkLabel: 'مشاوره رایگان',
    price: 'از ۵ میلیون تومان',
    delay: '',
  },
  {
    icon: '🎨',
    slug: 'ui-ux-design',
    cat: 'طراحی',
    title: 'UI/UX و هویت بصری',
    desc: 'طراحی تجربه‌ای منحصربه‌فرد برای کاربران و ساخت هویتی ماندگار برای برند شما در ذهن مخاطبان.',
    items: [
      'طراحی رابط کاربری (UI)',
      'تجربه کاربری (UX) و وایرفریم',
      'طراحی لوگو و برندینگ',
      'محتوای بصری شبکه‌های اجتماعی',
    ],
    linkLabel: 'مشاهده نمونه‌کارها',
    price: 'از ۲ میلیون تومان',
    delay: 'reveal-delay-1',
  },
  {
    icon: '📈',
    slug: 'seo-launch',
    cat: 'بهینه‌سازی',
    title: 'سئو و راه‌اندازی',
    desc: 'بهینه‌سازی سایت برای موتورهای جستجو، راه‌اندازی فنی، و پشتیبانی مستمر برای پایداری و رشد.',
    items: [
      'بهینه‌سازی سئو (On-Page / Off-Page)',
      'سئو فنی و بهبود سرعت بارگذاری',
      'راه‌اندازی و دیپلوی وب‌سایت',
      'نگهداری و پشتیبانی ماهانه',
    ],
    linkLabel: 'دریافت پیشنهاد',
    price: 'از ۱.۵ میلیون تومان',
    delay: 'reveal-delay-2',
  },
];

export const PRODUCTS = [
  {
    id: 'wp-business-pro',
    icon: '⚡',
    thumbLabel: 'WordPress Theme',
    thumbClass: 'product-thumb-1',
    badge: 'پرفروش',
    category: 'قالب وردپرس',
    name: 'قالب آماده کسب‌وکار پرو',
    sub: 'مناسب شرکت‌ها و آژانس‌های دیجیتال',
    price: '۲۸۰,۰۰۰',
    priceNum: 280000,
    delay: '',
    slug: 'business-pro-wordpress-theme',
    tags: ['وردپرس', 'کسب‌وکار', 'آژانس'],
  },
  {
    id: 'wp-shop',
    icon: '🛍️',
    thumbLabel: 'WooCommerce Theme',
    thumbClass: 'product-thumb-2',
    badge: 'جدید',
    category: 'قالب وردپرس',
    name: 'قالب آماده فروشگاه اینترنتی',
    sub: 'ووکامرس · طراحی مدرن · سریع',
    price: '۳۵۰,۰۰۰',
    priceNum: 350000,
    delay: 'reveal-delay-1',
    slug: 'ecommerce-woocommerce-theme',
    tags: ['ووکامرس', 'فروشگاه', 'وردپرس'],
  },
  {
    id: 'figma-admin',
    icon: '✦',
    thumbLabel: 'Figma UI Kit',
    thumbClass: 'product-thumb-3',
    badge: 'پیشنهادی',
    category: 'طرح فیگما',
    name: 'کیت UI داشبورد ادمین',
    sub: '+۱۲۰ کامپوننت · لایه‌بندی اصولی',
    price: '۱۸۵,۰۰۰',
    priceNum: 185000,
    delay: 'reveal-delay-2',
    slug: 'admin-dashboard-ui-kit',
    tags: ['فیگما', 'داشبورد', 'ادمین'],
  },
  {
    id: 'figma-mobile',
    icon: '📱',
    thumbLabel: 'Figma Mobile UI',
    thumbClass: 'product-thumb-4',
    badge: null,
    category: 'طرح فیگما',
    name: 'طرح آماده اپ موبایل',
    sub: 'iOS/Android · Dark & Light Mode',
    price: '۲۲۰,۰۰۰',
    priceNum: 220000,
    delay: 'reveal-delay-3',
    slug: 'mobile-app-figma-template',
    tags: ['فیگما', 'موبایل', 'اپلیکیشن'],
  },
  {
    id: 'wp-landing',
    icon: '🚀',
    thumbLabel: 'Landing Page',
    thumbClass: 'product-thumb-1',
    badge: null,
    category: 'قالب وردپرس',
    name: 'قالب لندینگ‌پیج تبلیغاتی',
    sub: 'پر‌تبدیل · A/B Ready · سریع',
    price: '۱۵۰,۰۰۰',
    priceNum: 150000,
    delay: '',
    slug: 'landing-page-theme',
    tags: ['لندینگ', 'تبلیغات', 'وردپرس'],
  },
  {
    id: 'figma-brand',
    icon: '💎',
    thumbLabel: 'Brand Identity Kit',
    thumbClass: 'product-thumb-3',
    badge: 'جدید',
    category: 'طرح فیگما',
    name: 'کیت هویت بصری برند',
    sub: 'لوگو + بیزینس کارت + برندبوک',
    price: '۲۵۰,۰۰۰',
    priceNum: 250000,
    delay: 'reveal-delay-1',
    slug: 'brand-identity-figma-kit',
    tags: ['فیگما', 'برند', 'لوگو', 'هویت بصری'],
  },
  {
    id: 'wp-portfolio',
    icon: '🎯',
    thumbLabel: 'Portfolio Theme',
    thumbClass: 'product-thumb-2',
    badge: null,
    category: 'قالب وردپرس',
    name: 'قالب پورتفولیو خلاق',
    sub: 'فریلنسرها · عکاسان · طراحان',
    price: '۱۲۰,۰۰۰',
    priceNum: 120000,
    delay: 'reveal-delay-2',
    slug: 'creative-portfolio-theme',
    tags: ['پورتفولیو', 'وردپرس', 'فریلنسر'],
  },
  {
    id: 'figma-saas',
    icon: '☁️',
    thumbLabel: 'SaaS Landing Figma',
    thumbClass: 'product-thumb-4',
    badge: 'پیشنهادی',
    category: 'طرح فیگما',
    name: 'طرح لندینگ SaaS فیگما',
    sub: 'نرم‌افزار · استارتاپ · مدرن',
    price: '۱۹۰,۰۰۰',
    priceNum: 190000,
    delay: 'reveal-delay-3',
    slug: 'saas-landing-figma',
    tags: ['فیگما', 'SaaS', 'استارتاپ', 'لندینگ'],
  },
];

export const PRODUCT_CATEGORIES = [
  { id: 'all',     label: 'همه محصولات' },
  { id: 'قالب وردپرس', label: 'قالب وردپرس' },
  { id: 'طرح فیگما', label: 'طرح فیگما' },
];

export const BANNER_FEATURES = [
  { icon: '✓', label: 'مشاوره رایگان' },
  { icon: '⚡', label: 'پاسخ‌دهی سریع' },
  { icon: '🔒', label: 'محرمانه و امن' },
  { icon: '★', label: 'ضمانت کیفیت' },
];

export const FOOTER_SERVICES = [
  { href: '/services', label: 'طراحی وب‌سایت' },
  { href: '/services', label: 'UI/UX و هویت بصری' },
  { href: '/services', label: 'بهینه‌سازی سئو' },
  { href: '/services', label: 'فروشگاه اینترنتی' },
  { href: '/services', label: 'پشتیبانی سایت' },
];

export const FOOTER_SHOP = [
  { href: '/shop', label: 'قالب‌های وردپرس' },
  { href: '/shop', label: 'طرح‌های فیگما' },
  { href: '/shop', label: 'کیت‌های UI' },
  { href: '/shop', label: 'قالب فروشگاه' },
  { href: '/shop', label: 'محصولات جدید' },
];

export const FOOTER_COMPANY = [
  { href: '/about',   label: 'درباره ما' },
  { href: '/order',   label: 'ثبت پروژه' },
  { href: '#',        label: 'نمونه‌کارها' },
  { href: '#',        label: 'وبلاگ' },
  { href: '/contact', label: 'تماس با ما' },
];

// ─── Order Form Data ──────────────────────────────────────────────────────────

export const ORDER_CATEGORIES = [
  {
    id: 'website',
    icon: '🌐',
    label: 'طراحی وب‌سایت',
    description: 'وب‌سایت شرکتی، فروشگاهی، خبری و...',
    subtypes: [
      { id: 'corporate', label: 'وب‌سایت شرکتی / سازمانی' },
      { id: 'ecommerce', label: 'فروشگاه اینترنتی (ووکامرس)' },
      { id: 'portfolio', label: 'وب‌سایت شخصی / پورتفولیو' },
      { id: 'landing',   label: 'لندینگ‌پیج تبلیغاتی' },
      { id: 'news',      label: 'سایت خبری / مجله' },
      { id: 'other',     label: 'سایر' },
    ],
  },
  {
    id: 'uiux',
    icon: '🎨',
    label: 'UI/UX طراحی',
    description: 'رابط کاربری، تجربه کاربری، وایرفریم',
    subtypes: [
      { id: 'web-ui',     label: 'طراحی UI وب‌سایت' },
      { id: 'mobile-ui',  label: 'طراحی UI اپلیکیشن موبایل' },
      { id: 'ux',         label: 'تحقیقات UX و وایرفریم' },
      { id: 'prototype',  label: 'نمونه اولیه (Prototype)' },
      { id: 'dashboard',  label: 'طراحی داشبورد / پنل مدیریت' },
    ],
  },
  {
    id: 'branding',
    icon: '💎',
    label: 'هویت بصری',
    description: 'لوگو، برندبوک، بنر و محتوای بصری',
    subtypes: [
      { id: 'logo',        label: 'طراحی لوگو' },
      { id: 'brandbook',   label: 'برندبوک کامل' },
      { id: 'bizcard',     label: 'کارت ویزیت' },
      { id: 'banner',      label: 'بنر و تبلیغات' },
      { id: 'social',      label: 'محتوای شبکه‌های اجتماعی' },
      { id: 'packaging',   label: 'طراحی بسته‌بندی' },
    ],
  },
  {
    id: 'seo',
    icon: '📈',
    label: 'سئو و بهینه‌سازی',
    description: 'سئو داخلی، خارجی، فنی و افزایش سرعت',
    subtypes: [
      { id: 'onpage',   label: 'سئو داخلی (On-Page)' },
      { id: 'offpage',  label: 'سئو خارجی (Off-Page)' },
      { id: 'technical',label: 'سئو فنی' },
      { id: 'speed',    label: 'افزایش سرعت سایت' },
      { id: 'content',  label: 'تولید محتوا برای سئو' },
    ],
  },
  {
    id: 'support',
    icon: '🛠️',
    label: 'پشتیبانی و نگهداری',
    description: 'نگهداری ماهانه، آپدیت، رفع باگ',
    subtypes: [
      { id: 'monthly',  label: 'پشتیبانی ماهانه' },
      { id: 'update',   label: 'بروزرسانی سایت' },
      { id: 'security', label: 'امنیت‌سازی' },
      { id: 'backup',   label: 'پشتیبان‌گیری' },
    ],
  },
];

export const BUDGET_OPTIONS = [
  { id: 'under-2m',   label: 'کمتر از ۲ میلیون',        icon: '💰', range: '< 2M' },
  { id: '2m-5m',      label: '۲ تا ۵ میلیون تومان',     icon: '💰', range: '2M-5M' },
  { id: '5m-10m',     label: '۵ تا ۱۰ میلیون تومان',    icon: '💰💰', range: '5M-10M' },
  { id: '10m-20m',    label: '۱۰ تا ۲۰ میلیون تومان',   icon: '💰💰', range: '10M-20M' },
  { id: 'over-20m',   label: 'بیشتر از ۲۰ میلیون',      icon: '💰💰💰', range: '> 20M' },
  { id: 'discuss',    label: 'قابل مذاکره',               icon: '🤝', range: 'negotiable' },
];

export const TIMELINE_OPTIONS = [
  { id: 'asap',    label: 'هرچه زودتر' },
  { id: '1month',  label: 'تا یک ماه' },
  { id: '2month',  label: '۱ تا ۲ ماه' },
  { id: '3month',  label: '۲ تا ۳ ماه' },
  { id: 'flexible',label: 'زمانبندی انعطاف‌پذیر' },
];

// Price estimator — rough ranges per category (Toman)
export const PRICE_ESTIMATES = {
  corporate:  { min: 5_000_000,  max: 20_000_000, label: '۵ تا ۲۰ میلیون تومان' },
  ecommerce:  { min: 8_000_000,  max: 30_000_000, label: '۸ تا ۳۰ میلیون تومان' },
  portfolio:  { min: 2_000_000,  max: 8_000_000,  label: '۲ تا ۸ میلیون تومان'  },
  landing:    { min: 1_500_000,  max: 5_000_000,  label: '۱.۵ تا ۵ میلیون تومان'},
  news:       { min: 5_000_000,  max: 15_000_000, label: '۵ تا ۱۵ میلیون تومان' },
  'web-ui':   { min: 3_000_000,  max: 12_000_000, label: '۳ تا ۱۲ میلیون تومان' },
  'mobile-ui':{ min: 4_000_000,  max: 15_000_000, label: '۴ تا ۱۵ میلیون تومان' },
  ux:         { min: 2_000_000,  max: 8_000_000,  label: '۲ تا ۸ میلیون تومان'  },
  dashboard:  { min: 5_000_000,  max: 20_000_000, label: '۵ تا ۲۰ میلیون تومان' },
  logo:       { min: 500_000,    max: 3_000_000,  label: '۵۰۰ هزار تا ۳ میلیون' },
  brandbook:  { min: 2_000_000,  max: 8_000_000,  label: '۲ تا ۸ میلیون تومان'  },
  onpage:     { min: 1_500_000,  max: 5_000_000,  label: '۱.۵ تا ۵ میلیون تومان'},
  speed:      { min: 800_000,    max: 3_000_000,  label: '۸۰۰ هزار تا ۳ میلیون' },
  monthly:    { min: 500_000,    max: 2_000_000,  label: '۵۰۰ هزار تا ۲ میلیون/ماه'},
  default:    { min: 1_000_000,  max: 10_000_000, label: '۱ تا ۱۰ میلیون تومان' },
};