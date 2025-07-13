"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-4 bg-white border-t border-gray-200 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center text-xs text-black gap-2">
        <span className="flex items-center gap-1 mb-1 sm:mb-0 text-black">
          Made with <span className="text-red-500 text-base">♥</span> -
          <Link
            href="https://www.linkedin.com/in/iamvishalsinha/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline hover:text-black transition font-medium ml-1"
          >
            Vishal Sinha
          </Link>
        </span>
        <div className="flex items-center gap-3 ml-0 sm:ml-4">
          <Link href="https://www.linkedin.com/in/iamvishalsinha/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="relative group">
            <svg className="w-4 h-4 text-black cursor-pointer group-hover:text-blue-700 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
            iamvishalsinha
            </span>
          </Link>
          <Link href="https://github.com/Vishal062" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="relative group">
            <svg className="w-4 h-4 text-black cursor-pointer group-hover:text-gray-700 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.018-2.25-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.921.43.372.823 1.104.823 2.226 0 1.606-.015 2.898-.015 3.293 0 .322.218.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              vishalsinha062
            </span>
          </Link>
          <Link href="https://twitter.com/sinhavishal19?t=abQ-DKRBtVg0O7zYxwnLzg&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="relative group">
            <svg className="w-4 h-4 text-black cursor-pointer group-hover:text-blue-500 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.39 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.117 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/></svg>
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              @sinhavishal19
            </span>
          </Link>
          <Link href="mailto:your@email.com" aria-label="Email" className="relative group">
            <svg className="w-4 h-4 text-black cursor-pointer group-hover:text-red-500 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20V8.99l8 6.99 8-6.99V20H4z"/></svg>
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              Email: vs9425348@gmail.com
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
} 