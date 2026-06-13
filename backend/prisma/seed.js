// prisma/seed.js
// Seeds the database with the initial data from siteData.js (frontend)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'Admin@12345',
    12
  );

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@digiteam.ir' },
    update: {},
    create: {
      email:  process.env.ADMIN_EMAIL || 'admin@digiteam.ir',
      name:   process.env.ADMIN_NAME  || 'مدیر سیستم',
      passwordHash: adminPasswordHash,
      role:       'ADMIN',
      isActive:   true,
      isVerified: true,
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // ─── Ticker Items ─────────────────────────────────────────────────────────
  await prisma.tickerItem.deleteMany({});
  await prisma.tickerItem.createMany({
    data: [
      { text: 'طراحی وب‌سایت حرفه‌ای',         sortOrder: 0 },
      { text: 'UI/UX و هویت بصری',              sortOrder: 1 },
      { text: 'بهینه‌سازی موتور جستجو',         sortOrder: 2 },
      { text: 'فروشگاه اینترنتی',                sortOrder: 3 },
      { text: 'قالب‌های آماده وردپرس',           sortOrder: 4 },
      { text: 'طراحی لوگو و برندینگ',            sortOrder: 5 },
      { text: 'پشتیبانی و نگهداری سایت',        sortOrder: 6 },
    ],
  });
  console.log('  ✓ Ticker items');

  // ─── Site Stats ───────────────────────────────────────────────────────────
  await prisma.siteStat.deleteMany({});
  await prisma.siteStat.createMany({
    data: [
      { key: 'projects', label: 'پروژه موفق',   value: '120', isStatic: false },
      { key: 'clients',  label: 'مشتری راضی',    value: '50',  isStatic: false },
      { key: 'rating',   label: 'میانگین رتبه',  value: '۵ ⭐', isStatic: true  },
    ],
  });
  console.log('  ✓ Site stats');

  // ─── Services ─────────────────────────────────────────────────────────────
  await prisma.serviceFeature.deleteMany({});
  await prisma.service.deleteMany({});

  const servicesData = [
    {
      slug: 'web-development',
      icon: '🌐',
      category: 'دسته ۱',
      title: 'توسعه وب‌سایت',
      description: 'ساخت وب‌سایت‌های سریع، امن و حرفه‌ای با فناوری‌های روز دنیا، سفارشی‌سازی‌شده برای اهداف شما.',
      sortOrder: 0,
      features: ['وب‌سایت شرکتی و سازمانی', 'وب‌سایت شخصی و پورتفولیو', 'فروشگاه اینترنتی (ووکامرس)', 'لندینگ‌پیج تبلیغاتی'],
    },
    {
      slug: 'ui-ux-design',
      icon: '🎨',
      category: 'دسته ۲',
      title: 'UI/UX و هویت بصری',
      description: 'طراحی تجربه‌ای منحصربه‌فرد برای کاربران و ساخت هویتی ماندگار برای برند شما در ذهن مخاطبان.',
      sortOrder: 1,
      features: ['طراحی رابط کاربری (UI)', 'تجربه کاربری (UX) و وایرفریم', 'طراحی لوگو و برندینگ', 'محتوای بصری شبکه‌های اجتماعی'],
    },
    {
      slug: 'seo-launch',
      icon: '📈',
      category: 'دسته ۳',
      title: 'سئو و راه‌اندازی',
      description: 'بهینه‌سازی سایت برای موتورهای جستجو، راه‌اندازی فنی، و پشتیبانی مستمر برای پایداری و رشد.',
      sortOrder: 2,
      features: ['بهینه‌سازی سئو (On-Page / Off-Page)', 'سئو فنی و بهبود سرعت بارگذاری', 'راه‌اندازی و دیپلوی وب‌سایت', 'نگهداری و پشتیبانی ماهانه'],
    },
  ];

  for (const s of servicesData) {
    const { features, ...serviceData } = s;
    await prisma.service.create({
      data: {
        ...serviceData,
        features: {
          create: features.map((label, i) => ({ label, sortOrder: i })),
        },
      },
    });
  }
  console.log('  ✓ Services');

  // ─── Categories ───────────────────────────────────────────────────────────
  await prisma.category.deleteMany({});
  const catWordpress = await prisma.category.create({
    data: { slug: 'wordpress-themes', name: 'قالب وردپرس' },
  });
  const catFigma = await prisma.category.create({
    data: { slug: 'figma-designs', name: 'طرح فیگما' },
  });
  console.log('  ✓ Categories');

  // ─── Products ─────────────────────────────────────────────────────────────
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  const productsData = [
    {
      slug: 'business-pro-wordpress-theme',
      name: 'قالب آماده کسب‌وکار پرو',
      subtitle: 'مناسب شرکت‌ها و آژانس‌های دیجیتال',
      description: 'یک قالب وردپرس حرفه‌ای و کامل برای کسب‌وکارها و آژانس‌های دیجیتال. طراحی مدرن، کاملاً ریسپانسیو و سازگار با سئو.',
      icon: '⚡',
      categoryId: catWordpress.id,
      price: 2800000,   // Rials (280,000 Toman)
      badge: 'پرفروش',
      isFeatured: true,
      tags: ['wordpress', 'business', 'agency'],
      sortOrder: 0,
    },
    {
      slug: 'ecommerce-woocommerce-theme',
      name: 'قالب آماده فروشگاه اینترنتی',
      subtitle: 'ووکامرس · طراحی مدرن · سریع',
      description: 'قالب فروشگاهی مدرن برای ووکامرس با طراحی زیبا و سرعت بالا. مناسب برای فروشگاه‌های آنلاین کوچک و بزرگ.',
      icon: '🛍️',
      categoryId: catWordpress.id,
      price: 3500000,
      badge: 'جدید',
      isFeatured: true,
      tags: ['woocommerce', 'ecommerce', 'shop'],
      sortOrder: 1,
    },
    {
      slug: 'admin-dashboard-ui-kit',
      name: 'کیت UI داشبورد ادمین',
      subtitle: '+۱۲۰ کامپوننت · لایه‌بندی اصولی',
      description: 'یک کیت UI کامل برای طراحی داشبوردهای ادمین در فیگما. شامل بیش از ۱۲۰ کامپوننت با لایه‌بندی اصولی.',
      icon: '✦',
      categoryId: catFigma.id,
      price: 1850000,
      badge: 'پیشنهادی',
      isFeatured: true,
      tags: ['figma', 'dashboard', 'admin', 'ui-kit'],
      sortOrder: 2,
    },
    {
      slug: 'mobile-app-figma-template',
      name: 'طرح آماده اپ موبایل',
      subtitle: 'iOS/Android · Dark & Light Mode',
      description: 'طرح آماده اپلیکیشن موبایل برای iOS و Android در فیگما. شامل Dark Mode و Light Mode با طراحی مدرن.',
      icon: '📱',
      categoryId: catFigma.id,
      price: 2200000,
      badge: null,
      isFeatured: true,
      tags: ['figma', 'mobile', 'ios', 'android', 'ui'],
      sortOrder: 3,
    },
  ];

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log('  ✓ Products');

  // ─── Site Settings ────────────────────────────────────────────────────────
  await prisma.siteSetting.deleteMany({});
  await prisma.siteSetting.createMany({
    data: [
      { key: 'site_name',       value: JSON.stringify('دیجی‌تیم'),            group: 'general' },
      { key: 'site_tagline',    value: JSON.stringify('آژانس دیجیتال حرفه‌ای'), group: 'general' },
      { key: 'contact_email',   value: JSON.stringify('info@digiteam.ir'),     group: 'contact' },
      { key: 'contact_phone',   value: JSON.stringify('021-12345678'),          group: 'contact' },
      { key: 'instagram_url',   value: JSON.stringify('https://instagram.com/digiteam'), group: 'social' },
      { key: 'telegram_url',    value: JSON.stringify('https://t.me/digiteam'),           group: 'social' },
      { key: 'linkedin_url',    value: JSON.stringify('https://linkedin.com/company/digiteam'), group: 'social' },
    ],
  });
  console.log('  ✓ Site settings');

  // ─── Sample Coupon ────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('  ✓ Sample coupon: WELCOME20 (20% off)');

  // ─── Order Form Config ────────────────────────────────────────────────────
  // پاک‌سازی قبلی (ترتیب مهمه چون FK داریم)
  await prisma.priceEstimateRule.deleteMany({});
  await prisma.projectSubcategory.deleteMany({});
  await prisma.projectMainCategory.deleteMany({});
  await prisma.budgetOption.deleteMany({});
  await prisma.timelineOption.deleteMany({});

  // دسته‌بندی‌های اصلی
  const mainCatsData = [
    { key: 'website',  title: 'طراحی وب‌سایت',     description: 'وب‌سایت شرکتی، فروشگاهی، خبری و...', icon: '🌐', sortOrder: 0 },
    { key: 'uiux',     title: 'UI/UX طراحی',         description: 'رابط کاربری، تجربه کاربری، وایرفریم',  icon: '🎨', sortOrder: 1 },
    { key: 'branding', title: 'هویت بصری',            description: 'لوگو، برندبوک، بنر و محتوای بصری',    icon: '💎', sortOrder: 2 },
    { key: 'seo',      title: 'سئو و بهینه‌سازی',    description: 'سئو داخلی، خارجی، فنی و افزایش سرعت', icon: '📈', sortOrder: 3 },
    { key: 'support',  title: 'پشتیبانی و نگهداری', description: 'نگهداری ماهانه، آپدیت، رفع باگ',      icon: '🛠️', sortOrder: 4 },
  ];

  const createdMainCats = {};
  for (const cat of mainCatsData) {
    const created = await prisma.projectMainCategory.create({ data: cat });
    createdMainCats[cat.key] = created.id;
  }

  // زیردسته‌ها
  const subCatsData = [
    // website
    { label: 'وب‌سایت شرکتی / سازمانی',        mainCategoryKey: 'website',  sortOrder: 0 },
    { label: 'فروشگاه اینترنتی (ووکامرس)',       mainCategoryKey: 'website',  sortOrder: 1 },
    { label: 'وب‌سایت شخصی / پورتفولیو',        mainCategoryKey: 'website',  sortOrder: 2 },
    { label: 'لندینگ‌پیج تبلیغاتی',             mainCategoryKey: 'website',  sortOrder: 3 },
    { label: 'سایت خبری / مجله',                mainCategoryKey: 'website',  sortOrder: 4 },
    { label: 'سایر',                              mainCategoryKey: 'website',  sortOrder: 5 },
    // uiux
    { label: 'طراحی UI وب‌سایت',                mainCategoryKey: 'uiux',     sortOrder: 0 },
    { label: 'طراحی UI اپلیکیشن موبایل',        mainCategoryKey: 'uiux',     sortOrder: 1 },
    { label: 'تحقیقات UX و وایرفریم',           mainCategoryKey: 'uiux',     sortOrder: 2 },
    { label: 'نمونه اولیه (Prototype)',           mainCategoryKey: 'uiux',     sortOrder: 3 },
    { label: 'طراحی داشبورد / پنل مدیریت',     mainCategoryKey: 'uiux',     sortOrder: 4 },
    // branding
    { label: 'طراحی لوگو',                       mainCategoryKey: 'branding', sortOrder: 0 },
    { label: 'برندبوک کامل',                     mainCategoryKey: 'branding', sortOrder: 1 },
    { label: 'کارت ویزیت',                       mainCategoryKey: 'branding', sortOrder: 2 },
    { label: 'بنر و تبلیغات',                    mainCategoryKey: 'branding', sortOrder: 3 },
    { label: 'محتوای شبکه‌های اجتماعی',         mainCategoryKey: 'branding', sortOrder: 4 },
    { label: 'طراحی بسته‌بندی',                  mainCategoryKey: 'branding', sortOrder: 5 },
    // seo
    { label: 'سئو داخلی (On-Page)',              mainCategoryKey: 'seo',      sortOrder: 0 },
    { label: 'سئو خارجی (Off-Page)',             mainCategoryKey: 'seo',      sortOrder: 1 },
    { label: 'سئو فنی',                          mainCategoryKey: 'seo',      sortOrder: 2 },
    { label: 'افزایش سرعت سایت',                mainCategoryKey: 'seo',      sortOrder: 3 },
    { label: 'تولید محتوا برای سئو',            mainCategoryKey: 'seo',      sortOrder: 4 },
    // support
    { label: 'پشتیبانی ماهانه',                  mainCategoryKey: 'support',  sortOrder: 0 },
    { label: 'بروزرسانی سایت',                   mainCategoryKey: 'support',  sortOrder: 1 },
    { label: 'امنیت‌سازی',                       mainCategoryKey: 'support',  sortOrder: 2 },
    { label: 'پشتیبان‌گیری',                     mainCategoryKey: 'support',  sortOrder: 3 },
  ];

  await prisma.projectSubcategory.createMany({
    data: subCatsData.map(({ mainCategoryKey, ...rest }) => ({
      ...rest,
      mainCategoryId: createdMainCats[mainCategoryKey],
    })),
  });

  // گزینه‌های بودجه
  const budgetData = [
    { label: 'کمتر از ۲ میلیون',       value: 'under_2m',  icon: '💰',     sortOrder: 0 },
    { label: '۲ تا ۵ میلیون تومان',    value: '2m_5m',     icon: '💰',     sortOrder: 1 },
    { label: '۵ تا ۱۰ میلیون تومان',   value: '5m_10m',    icon: '💰💰',   sortOrder: 2 },
    { label: '۱۰ تا ۲۰ میلیون تومان',  value: '10m_20m',   icon: '💰💰',   sortOrder: 3 },
    { label: 'بیشتر از ۲۰ میلیون',     value: 'over_20m',  icon: '💰💰💰', sortOrder: 4 },
    { label: 'قابل مذاکره',             value: 'discuss',   icon: '🤝',     sortOrder: 5 },
  ];
  await prisma.budgetOption.createMany({ data: budgetData });

  // گزینه‌های زمانبندی
  const timelineData = [
    { label: 'هرچه زودتر',               value: 'asap',     sortOrder: 0 },
    { label: 'تا یک ماه',                value: '1m',       sortOrder: 1 },
    { label: '۱ تا ۲ ماه',              value: '1m_2m',    sortOrder: 2 },
    { label: '۲ تا ۳ ماه',              value: '2m_3m',    sortOrder: 3 },
    { label: 'زمانبندی انعطاف‌پذیر',    value: 'flexible', sortOrder: 4 },
  ];
  await prisma.timelineOption.createMany({ data: timelineData });

  // قانون تخمین قیمت پیش‌فرض (بدون budget و timeline خاص)
  await prisma.priceEstimateRule.create({
    data: {
      budgetOptionId:   null,
      timelineOptionId: null,
      minAmount: 1,
      maxAmount: 10,
      unit: 'میلیون تومان',
      isActive: true,
    },
  });

  console.log('  ✓ Order form config (main categories, subcategories, budget & timeline options, default price rule)');

  console.log('\n✅ Database seeded successfully!\n');
  console.log(`   Admin login: ${process.env.ADMIN_EMAIL || 'admin@digiteam.ir'}`);
  console.log(`   Admin pass:  ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });