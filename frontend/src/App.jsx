// src/App.jsx
import { useState, useEffect } from 'react';
import { useScrollReveal } from './hooks/useScrollReveal';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar  from './components/layout/Navbar';
import Footer  from './components/layout/Footer';

// Home sections
import Hero          from './components/sections/Hero';
import Ticker        from './components/sections/Ticker';
import Services      from './components/sections/Services';
import Shop          from './components/sections/Shop';
import ProjectBanner from './components/sections/ProjectBanner';

// Pages
import ShopPage           from './pages/ShopPage';
import ServicesPage       from './pages/ServicesPage';
import OrderPage          from './pages/OrderPage';
import AboutPage          from './pages/AboutPage';
import ProductDetailPage  from './pages/ProductDetailPage';
import CheckoutPage       from './pages/CheckoutPage';
import DashboardPage      from './pages/DashboardPage';

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

function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // /product/:slug
  const productMatch = path.match(/^\/product\/(.+)$/);
  if (productMatch) {
    return <ProductDetailPage slug={productMatch[1]} />;
  }

  switch (path) {
    case '/shop':       return <ShopPage />;
    case '/services':   return <ServicesPage />;
    case '/order':      return <OrderPage />;
    case '/about':      return <AboutPage />;
    case '/checkout':   return <CheckoutPage />;
    case '/dashboard':  return <DashboardPage />;
    default:            return <HomePage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="bg-bg-base text-text-primary font-vazir leading-[1.7] min-h-screen">
          <Navbar />
          <Router />
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
