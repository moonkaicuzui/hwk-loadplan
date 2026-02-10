/**
 * @fileoverview Theme Context
 * Provides dark/light mode management with localStorage persistence.
 *
 * @module contexts/ThemeContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ========================================
// Context
// ========================================

const ThemeContext = createContext(null);

// ========================================
// Constants
// ========================================

const THEME_KEY = 'theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// ========================================
// Helper Functions
// ========================================

/**
 * Get system preference for dark mode
 */
function getSystemPreference() {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return THEMES.DARK;

  const stored = localStorage.getItem(THEME_KEY);
  if (stored && Object.values(THEMES).includes(stored)) {
    return stored;
  }

  // Default to dark for this dashboard
  return THEMES.DARK;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  const effectiveTheme = theme === THEMES.SYSTEM ? getSystemPreference() : theme;

  if (effectiveTheme === THEMES.DARK) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// ========================================
// Custom Hook
// ========================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ========================================
// Provider Component
// ========================================

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setThemeState(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const effectiveTheme = theme === THEMES.SYSTEM ? getSystemPreference() : theme;
    const newTheme = effectiveTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Check if current theme is dark
  const isDark = theme === THEMES.DARK ||
    (theme === THEMES.SYSTEM && getSystemPreference() === THEMES.DARK);

  // Context value
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    themes: THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
