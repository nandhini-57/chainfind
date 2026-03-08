export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base colors
        bg: '#0f172a',
        surface: '#1e293b',
        surface2: '#334155',
        border: '#475569',
        
        // Primary Amber/Orange
        primary: '#fbbf24',
        'primary-light': '#fcd34d',
        'primary-dark': '#f59e0b',
        
        // Secondary Orange
        accent: '#f97316',
        'accent-light': '#fb923c',
        'accent-dark': '#ea580c',
        
        // Text colors
        text: '#f1f5f9',
        'text-muted': '#94a3b8',
        'text-dim': '#64748b',
      },
      fontFamily: { 
        mono: ['"Space Mono"', 'monospace'], 
        sans: ['Syne', 'sans-serif'] 
      }
    }
  },
  plugins: []
}

