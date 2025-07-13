'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation and Hero Section */}
      <div className="relative z-10">
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left: Text and Buttons */}
            <div className="flex-1 text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 mb-8">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SEO Digital Agency
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Dive <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Into The SEO World</span>
                <br />
                <span className="text-gray-800 dark:text-gray-200">With Tale</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto md:mx-0 mb-12 leading-relaxed">
                Tale is the best SEO agency website template using modern web tech for your company. 
                Analyze, compare, and improve your SEO with our advanced tools and insights.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center mb-4">
                <Link href="/check-seo">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check SEO
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
                <Link href="/compare-seo">
                  <button className="px-8 py-4 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-semibold rounded-full shadow-lg hover:shadow-xl border-2 border-purple-200 dark:border-purple-600 hover:border-purple-300 dark:hover:border-purple-500 transform hover:-translate-y-1 transition-all duration-300">
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Compare SEO
                    </span>
                  </button>
                </Link>
              </div>
            </div>
            {/* Right: Hero Image Illustration */}
            {/* <div className="flex-1 flex justify-center items-center w-full md:w-auto">
              <Image src="/hero_icon.png" alt="SEO VR Hero" width={500} height={400} priority style={{objectFit: 'contain', maxWidth: '100%', height: 'auto'}} />
            </div> */}
          </div>
        </div>
      </div>
      {/* Footer: Made with Love and Social Links */}
      <footer className="fixed bottom-2 left-0 w-full flex flex-col items-center justify-center z-50 pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center text-xs text-black dark:text-white">
          <span className="flex items-center gap-1 mb-1">
            Made with <span className="text-red-500 text-base">♥</span> -
            <a
              href="https://www.linkedin.com/in/vishalsinha01/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black dark:text-white hover:underline hover:text-blue-800 dark:hover:text-blue-400 transition pointer-events-auto select-auto"
              style={{ fontWeight: 500 }}
            >
              Vishal Sinha
            </a>
          </span>
          <div className="flex gap-2 pointer-events-auto select-auto">
            <a href="https://www.linkedin.com/in/vishalsinha01/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg className="w-4 h-4 text-black dark:text-white hover:text-blue-900 dark:hover:text-blue-400 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
            </a>
            <a href="https://github.com/vishalsinha01" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg className="w-4 h-4 text-black dark:text-white hover:text-black dark:hover:text-gray-300 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.018-2.25-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.921.43.372.823 1.104.823 2.226 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://twitter.com/vishalsinha01" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg className="w-4 h-4 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.39 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.117 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}