// src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useActiveNav } from '../../hooks/useActiveNav';
import { NAV_LINKS } from '../../data/siteData';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveNav();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMenuOpen(false);
  const toggleMenu  = () => setMenuOpen(p => !p);

  return (
    <header>
      {/* Desktop Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] h-18 flex items-center transition-all duration-300
          ${scrolled
            ? 'bg-bg-base/85 backdrop-blur-[20px] shadow-[0_1px_0_rgba(255,255,255,0.07)]'
            : 'bg-transparent'
          }`}
      >
        <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Logo />

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`nav-link-active-wrapper relative inline-block px-4 py-2 rounded-sm text-[0.9rem] font-medium no-underline transition-all duration-300 hover:text-text-primary hover:bg-white/5
                      ${isActive
                        ? 'nav-link-active text-text-primary bg-white/5'
                        : 'text-text-secondary'
                      }`}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Button href="#project" variant="primary">
              ثبت پروژه <ArrowIcon />
            </Button>

            {/* Hamburger */}
            <button
              onClick={toggleMenu}
              aria-label="منو"
              className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1.5"
            >
              <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-[72px] left-0 right-0 bottom-0 bg-[rgba(20,20,20,0.97)] backdrop-blur-[20px] z-[99] flex flex-col items-center justify-center gap-3 px-10 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="text-[1.4rem] font-bold text-text-secondary px-6 py-2.5 rounded-md transition-all duration-300 w-full text-center no-underline block hover:text-text-primary hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <Button href="#project" variant="primary" onClick={closeMobile} className="w-full justify-center mt-2">
            ثبت پروژه
          </Button>
        </div>
      )}
    </header>
  );
}
