'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import Footer from "@/components/Footer";

export default function LandingPage() {
  // Removed useEffect that sets overflow:hidden
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation and Hero Section */}
      <div className="relative z-10">
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left: Text and Buttons */}
            <div className="flex-1 text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-8">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SEO QA Made Simple for Developers & Testers
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Dive <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Into The SEO World</span>
                <br />
                <span className="text-gray-800">With Tale</span>
              </h1>

              {/* Subtitle */}
              {/* <p className="text-xl text-gray-600 max-w-3xl mx-auto md:mx-0 mb-12 leading-relaxed">
                Tale is the best SEO agency website template using modern web tech for your company. 
                Analyze, compare, and improve your SEO with our advanced tools and insights.
              </p> */}
              <p className="text-xl text-gray-600 max-w-3xl mx-auto md:mx-0 mb-12 leading-relaxed">
                It started with a broken
                <span className="font-semibold text-blue-600"> &lt;title&gt; </span>
                tag in production — a small miss, but a big hit on search traffic.
                As devs and testers, we realized SEO often gets overlooked in the CI/CD flow.
                So we built a tool that compares SEO across UAT and Production in real time —
                simple, fast, and made for teams who care about the little things before they become big problems.
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
                  <button className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full shadow-lg hover:shadow-xl border-2 border-purple-200 hover:border-purple-300 transform hover:-translate-y-1 transition-all duration-300">
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
      {/* Footer: Use independent component */}
      <Footer />
    </div>
  );
}