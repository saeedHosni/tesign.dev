// src/data/siteData.js

export const NAV_LINKS = [
  { href: '#hero',     label: 'خانه' },
  { href: '#services', label: 'خدمات' },
  { href: '#shop',     label: 'فروشگاه' },
  { href: '#about',    label: 'درباره ما' },
];

export const TICKER_ITEMS = [
  'طراحی وب‌سایت حرفه‌ای',
  'UI/UX و هویت بصری',
  'بهینه‌سازی موتور جستجو',
  'فروشگاه اینترنتی',
  'قالب‌های آماده وردپرس',
  'طراحی لوگو و برندینگ',
  'پشتیبانی و نگهداری سایت',
];

export const HERO_STATS = [
  { num: 120, suffix: '', label: 'پروژه موفق' },
  { num: 50,  suffix: '', label: 'مشتری راضی' },
  { num: null, static: '۵ ⭐', label: 'میانگین رتبه' },
];

export const SERVICES = [
  {
    icon: '🌐',
    cat: 'دسته ۱',
    title: 'توسعه وب‌سایت',
    desc: 'ساخت وب‌سایت‌های سریع، امن و حرفه‌ای با فناوری‌های روز دنیا، سفارشی‌سازی‌شده برای اهداف شما.',
    items: [
      'وب‌سایت شرکتی و سازمانی',
      'وب‌سایت شخصی و پورتفولیو',
      'فروشگاه اینترنتی (ووکامرس)',
      'لندینگ‌پیج تبلیغاتی',
    ],
    linkLabel: 'مشاوره رایگان',
    delay: '',
  },
  {
    icon: '🎨',
    cat: 'دسته ۲',
    title: 'UI/UX و هویت بصری',
    desc: 'طراحی تجربه‌ای منحصربه‌فرد برای کاربران و ساخت هویتی ماندگار برای برند شما در ذهن مخاطبان.',
    items: [
      'طراحی رابط کاربری (UI)',
      'تجربه کاربری (UX) و وایرفریم',
      'طراحی لوگو و برندینگ',
      'محتوای بصری شبکه‌های اجتماعی',
    ],
    linkLabel: 'مشاهده نمونه‌کارها',
    delay: 'reveal-delay-1',
  },
  {
    icon: '📈',
    cat: 'دسته ۳',
    title: 'سئو و راه‌اندازی',
    desc: 'بهینه‌سازی سایت برای موتورهای جستجو، راه‌اندازی فنی، و پشتیبانی مستمر برای پایداری و رشد.',
    items: [
      'بهینه‌سازی سئو (On-Page / Off-Page)',
      'سئو فنی و بهبود سرعت بارگذاری',
      'راه‌اندازی و دیپلوی وب‌سایت',
      'نگهداری و پشتیبانی ماهانه',
    ],
    linkLabel: 'دریافت پیشنهاد',
    delay: 'reveal-delay-2',
  },
];

export const PRODUCTS = [
  {
    icon: '⚡',
    thumbLabel: 'WordPress Theme',
    thumbClass: 'product-thumb-1',
    badge: 'پرفروش',
    category: 'قالب وردپرس',
    name: 'قالب آماده کسب‌وکار پرو',
    sub: 'مناسب شرکت‌ها و آژانس‌های دیجیتال',
    price: '۲۸۰,۰۰۰',
    delay: '',
  },
  {
    icon: '🛍️',
    thumbLabel: 'WooCommerce Theme',
    thumbClass: 'product-thumb-2',
    badge: 'جدید',
    category: 'قالب وردپرس',
    name: 'قالب آماده فروشگاه اینترنتی',
    sub: 'ووکامرس · طراحی مدرن · سریع',
    price: '۳۵۰,۰۰۰',
    delay: 'reveal-delay-1',
  },
  {
    icon: '✦',
    thumbLabel: 'Figma UI Kit',
    thumbClass: 'product-thumb-3',
    badge: 'پیشنهادی',
    category: 'طرح فیگما',
    name: 'کیت UI داشبورد ادمین',
    sub: '+۱۲۰ کامپوننت · لایه‌بندی اصولی',
    price: '۱۸۵,۰۰۰',
    delay: 'reveal-delay-2',
  },
  {
    icon: '📱',
    thumbLabel: 'Figma Mobile UI',
    thumbClass: 'product-thumb-4',
    badge: null,
    category: 'طرح فیگما',
    name: 'طرح آماده اپ موبایل',
    sub: 'iOS/Android · Dark & Light Mode',
    price: '۲۲۰,۰۰۰',
    delay: 'reveal-delay-3',
  },
];

export const BANNER_FEATURES = [
  { icon: '✓', label: 'مشاوره رایگان' },
  { icon: '⚡', label: 'پاسخ‌دهی سریع' },
  { icon: '🔒', label: 'محرمانه و امن' },
  { icon: '★', label: 'ضمانت کیفیت' },
];

export const FOOTER_SERVICES = [
  { href: '#services', label: 'طراحی وب‌سایت' },
  { href: '#services', label: 'UI/UX و هویت بصری' },
  { href: '#services', label: 'بهینه‌سازی سئو' },
  { href: '#services', label: 'فروشگاه اینترنتی' },
  { href: '#services', label: 'پشتیبانی سایت' },
];

export const FOOTER_SHOP = [
  { href: '#shop', label: 'قالب‌های وردپرس' },
  { href: '#shop', label: 'طرح‌های فیگما' },
  { href: '#shop', label: 'کیت‌های UI' },
  { href: '#shop', label: 'قالب فروشگاه' },
  { href: '#shop', label: 'محصولات جدید' },
];

export const FOOTER_COMPANY = [
  { href: '#about', label: 'درباره ما' },
  { href: '#project', label: 'ثبت پروژه' },
  { href: '#', label: 'نمونه‌کارها' },
  { href: '#', label: 'وبلاگ' },
  { href: '#', label: 'تماس با ما' },
];
