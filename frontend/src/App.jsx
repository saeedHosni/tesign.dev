// src/App.jsx  — نسخه کامل با مسیریابی ادمین
import { useState, useEffect } from 'react';
import { useScrollReveal } from './hooks/useScrollReveal';
import { CartProvider }  from './context/CartContext';
import { AuthProvider }  from './context/AuthContext';
import Navbar  from './components/layout/Navbar';
import Footer  from './components/layout/Footer';

// Home sections
import Hero          from './components/sections/Hero';
import Ticker        from './components/sections/Ticker';
import Services      from './components/sections/Services';
import Shop          from './components/sections/Shop';
import ProjectBanner from './components/sections/ProjectBanner';

// Public pages
import ShopPage          from './pages/ShopPage';
import OrderPage         from './pages/OrderPage';
import AboutPage         from './pages/AboutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage      from './pages/CheckoutPage';
import DashboardPage     from './pages/DashboardPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';

// Admin pages
import AdminOverviewPage    from './pages/admin/AdminOverviewPage';
import AdminProductsPage    from './pages/admin/AdminProductsPage';
import AdminCategoriesPage  from './pages/admin/AdminCategoriesPage';
import AdminServicesPage    from './pages/admin/AdminServicesPage';
import AdminOrdersPage      from './pages/admin/AdminOrdersPage';
import AdminUsersPage       from './pages/admin/AdminUsersPage';
import AdminSettingsPage    from './pages/admin/AdminSettingsPage';
import { AdminProjectsPage, AdminReviewsPage, AdminCouponsPage } from './pages/admin/AdminMiscPages';
import AdminOrderFormConfigPage from './pages/admin/AdminOrderFormConfigPage';

function HomePage() {
  useScrollReveal();
  return (
    <main>
      <Hero />
      <Ticker />
      <Services />
      <Shop />
      <ProjectBanner />
    </main>
  );
}

// صفحات ادمین — بدون Navbar/Footer سایت
function AdminRouter({ path }) {
  if (path === '/admin' || path === '/admin/')         return <AdminOverviewPage />;
  if (path.startsWith('/admin/products'))              return <AdminProductsPage />;
  if (path.startsWith('/admin/categories'))            return <AdminCategoriesPage />;
  if (path.startsWith('/admin/services'))              return <AdminServicesPage />;
  if (path.startsWith('/admin/orders'))                return <AdminOrdersPage />;
  if (path.startsWith('/admin/users'))                 return <AdminUsersPage />;
  if (path.startsWith('/admin/settings'))              return <AdminSettingsPage />;
  if (path.startsWith('/admin/projects'))              return <AdminProjectsPage />;
  if (path.startsWith('/admin/reviews'))               return <AdminReviewsPage />;
  if (path.startsWith('/admin/coupons'))               return <AdminCouponsPage />;
  if (path.startsWith('/admin/order-form-config'))     return <AdminOrderFormConfigPage />;
  return <AdminOverviewPage />;
}

function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── Admin section (no public navbar/footer) ──────────────────────────────
  if (path.startsWith('/admin')) {
    return <AdminRouter path={path} />;
  }

  // ── Public section ───────────────────────────────────────────────────────
  const productMatch = path.match(/^\/product\/(.+)$/);
  if (productMatch) {
    return (
      <>
        <Navbar /><ProductDetailPage slug={productMatch[1]} /><Footer />
      </>
    );
  }

  const publicPage = (() => {
    switch (path) {
      case '/shop':      return <ShopPage />;
      case '/order':     return <OrderPage />;
      case '/about':     return <AboutPage />;
      case '/checkout':  return <CheckoutPage />;
      case '/dashboard': return <DashboardPage />;
      case '/payment/callback': return <PaymentCallbackPage />;
      default:           return <HomePage />;
    }
  })();

  return (
    <>
      <Navbar />
      {publicPage}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="bg-bg-base text-text-primary font-vazir leading-[1.7] min-h-screen">
          <Router />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}