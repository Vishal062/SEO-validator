"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  // Animation state for nav links
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const navLinks = [
    { href: "/check-seo", label: "Check SEO" },
    { href: "/compare-seo", label: "Compare SEO" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];
  const pathname = usePathname();
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
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-white focus:outline-none"
            aria-label="Toggle navigation"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-white font-medium hover:text-purple-200 transition-colors px-4 py-2 block relative
                ${clickedIdx === idx ? 'animate-navClick' : ''}
                ${pathname === link.href ? 'border-b-2 border-white bg-white/10 text-purple-100 shadow-sm' : ''}`}
              onClick={() => {
                setClickedIdx(idx);
                setTimeout(() => setClickedIdx(null), 350);
              }}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      <div className={`flex-col md:flex-row md:flex gap-2 md:gap-6 items-center ${open ? 'flex' : 'hidden'} md:hidden bg-gradient-to-r from-purple-600 to-blue-500 md:bg-none absolute md:static top-12 left-0 w-full md:w-auto z-50 md:z-auto`}>
        {navLinks.map((link, idx) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-white font-medium hover:text-purple-200 transition-colors px-4 py-2 block relative
              ${clickedIdx === idx ? 'animate-navClick' : ''}
              ${pathname === link.href ? 'border-b-2 border-white bg-white/10 text-purple-100 shadow-sm' : ''}`}
            onClick={() => {
              setClickedIdx(idx);
              setTimeout(() => setClickedIdx(null), 350);
              setOpen(false);
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
      
      {/* Animation keyframes for nav click */}
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
      `}</style>
    </nav>
  );
} 