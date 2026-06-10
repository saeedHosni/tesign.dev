// src/App.jsx
import { useScrollReveal } from './hooks/useScrollReveal';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Ticker from './components/sections/Ticker';
import Services from './components/sections/Services';
import Shop from './components/sections/Shop';
import ProjectBanner from './components/sections/ProjectBanner';

export default function App() {
  useScrollReveal();

  return (
    <div className="bg-bg-base text-text-primary font-vazir leading-[1.7] min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <Services />
        <Shop />
        <ProjectBanner />
      </main>
      <Footer />
    </div>
  );
}
