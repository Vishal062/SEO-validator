"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const [open, setOpen] = useState(false); // Mobile menu state
  const [toolsOpen, setToolsOpen] = useState(false); // Desktop tools menu state 
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Animation state for nav links
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  
  const mainLinks = [
    { href: "/check-seo", label: "Check SEO" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  const toolLinks = [
    { href: "/intelliseo", label: "Intelli SEO" },
    { href: "/snapshot-seo", label: "Snapshot SEO" },
    { href: "/seo-crawler-pro", label: "Crawler Pro" },
  ];

  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1.5 shadow min-h-[48px]">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo at far left */}
        <div className="flex items-center gap-2 min-w-[120px] justify-start">
          <Link href="/" className="focus:outline-none">
            <span className="text-xl font-bold text-white tracking-tight cursor-pointer pl-1">SEO<span className="text-purple-200">Tale</span></span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-white focus:outline-none"
            aria-label="Toggle navigation"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Links + Hamburger / Mobile Links Wrapper */}
        <div className={`flex-col md:flex-row md:flex gap-2 md:gap-6 items-center ${open ? 'flex' : 'hidden'} md:flex bg-gradient-to-r from-purple-600 to-blue-500 md:bg-none absolute md:static top-12 left-0 w-full md:w-auto z-50 md:z-auto`}>
          
          {/* Main Links */}
          {mainLinks.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-white font-medium hover:text-purple-200 transition-colors px-4 py-2 block relative
                ${clickedIdx === idx ? 'animate-navClick' : ''}
                ${pathname === link.href ? 'border-b-2 border-white bg-white/10 text-purple-100 shadow-sm' : ''}`}
              onClick={() => {
                setOpen(false); // close mobile menu on click
                setClickedIdx(idx);
                setTimeout(() => setClickedIdx(null), 350);
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Special Tools Hamburger Dropdown (Desktop) */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="text-white focus:outline-none p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
              title="Advanced SEO Tools"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {toolsOpen && (
              <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 flex flex-col border border-gray-100 origin-top-right animate-dropdown z-[100]">
                {toolLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-5 py-3 text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-3 ${
                      pathname.startsWith(link.href) ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'
                    }`}
                    onClick={() => setToolsOpen(false)}
                  >
                    <span>{link.label === 'Intelli SEO' ? '🧠' : link.label === 'Snapshot SEO' ? '📸' : '🕷️'}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Tools Section (shows directly in the mobile menu list) */}
          <div className="md:hidden w-full pt-4 mt-2 border-t border-white/20">
            <div className="px-4 text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Advanced Tools</div>
            {toolLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-white font-medium hover:text-purple-200 transition-colors px-4 py-2 block relative rounded-lg ${
                  pathname.startsWith(link.href) ? 'bg-white/10 text-purple-100' : ''
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

        </div>
      </div>
      
      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes navClick {
          0% { transform: scale(1); background: transparent; }
          30% { transform: scale(1.08); background: rgba(255,255,255,0.12); }
          60% { transform: scale(0.96); background: rgba(168,85,247,0.18); }
          100% { transform: scale(1); background: transparent; }
        }
        .animate-navClick {
          animation: navClick 0.35s cubic-bezier(.4,0,.2,1);
          border-radius: 0.5rem;
        }
        @keyframes dropdown {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dropdown {
          animation: dropdown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </nav>
  );
} 