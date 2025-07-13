'use client';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '@/app/themeSlice';
import type { RootState } from '@/app/store';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  // Function to apply theme to document
  const applyTheme = (themeMode: 'light' | 'dark') => {
    const htmlElement = document.documentElement;
    
    if (themeMode === 'dark') {
      htmlElement.classList.add('dark');
      console.log('✅ Applied dark theme');
    } else {
      htmlElement.classList.remove('dark');
      console.log('✅ Applied light theme');
    }
  };

  // Initialize theme - ALWAYS start with light mode and clear any old preferences
  useEffect(() => {
    console.log('🚀 Initializing theme to LIGHT mode');
    // Clear any old theme preferences
    localStorage.removeItem('theme');
    // Force light mode
    dispatch(setTheme('light'));
    applyTheme('light');
    localStorage.setItem('theme', 'light');
  }, [dispatch]);

  // Apply theme to document when theme changes
  useEffect(() => {
    console.log('🔄 Theme state changed to:', theme);
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - dragStartY;
    if (Math.abs(deltaY) > 30) {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      console.log('👆 Dragging to switch theme to:', newTheme);
      dispatch(setTheme(newTheme));
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isDragging) {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      console.log('🖱️ Clicking to switch theme to:', newTheme);
      dispatch(setTheme(newTheme));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartY, theme]);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        className={`
          relative w-12 h-12 rounded-full p-2 transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'bg-gray-800 text-yellow-400 shadow-lg shadow-gray-900/50' 
            : 'bg-white text-gray-600 shadow-lg shadow-gray-200/50'
          }
          hover:scale-110 active:scale-95
          ${isDragging ? 'scale-110' : ''}
        `}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {/* Sun Icon for Light Mode */}
        {theme === 'light' && (
          <svg 
            className="w-6 h-6 transition-transform duration-300" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
          </svg>
        )}
        
        {/* Moon Icon for Dark Mode */}
        {theme === 'dark' && (
          <svg 
            className="w-6 h-6 transition-transform duration-300" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      {/* Drag indicator */}
      <div className={`
        absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center
        ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
        transition-opacity duration-300
        ${isDragging ? 'opacity-100' : 'opacity-0'}
      `}>
        Drag to switch
      </div>
    </div>
  );
} 