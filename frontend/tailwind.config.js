/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Clean Amber Intelligence ──
        // Semantic tokens map to CSS variables so themes stay centralized.
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-fg) / <alpha-value>)',
        },
        // Amber brand scale (primary identity — never blue)
        amber: {
          surface: '#FEF3C7', // light amber surface
          soft: '#FCD34D',    // soft gold
          DEFAULT: '#F59E0B', // primary amber
          deep: '#D97706',    // deep amber
          brown: '#92400E',   // dark brown
        },
        primary: {
          DEFAULT: '#F59E0B',
          foreground: '#1F2937',
        },
        // Status (meaningful only — never color alone)
        success: '#059669',
        critical: '#DC2626',
        // Risk ramp (Low -> Critical), amber-forward
        risk: {
          low: '#059669',
          medium: '#F59E0B',
          high: '#D97706',
          critical: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        elevated: '0 4px 12px rgba(146,64,14,0.08), 0 2px 4px rgba(16,24,40,0.04)',
        amber: '0 8px 24px rgba(245,158,11,0.18)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
