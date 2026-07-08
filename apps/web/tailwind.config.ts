import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Speakeasy noir palette (from the MAFIA Game design)
        ink: '#0b0805', // page background
        coal: '#100b07', // panel background
        parchment: '#efe6d3', // primary text
        gold: {
          DEFAULT: '#d99c4a',
          bright: '#e8b568',
        },
        noir: '#b8402e', // danger / mafia-red accent
        blush: '#e8b0a4', // night-phase prompt tint
        // Role identity colors (keep in sync with packages/shared/src/roles.ts)
        mafia: '#B91C1C',
        detective: '#4F46E5',
        doctor: '#059669',
        civilian: '#6B7280',
        dead: '#3F3F46',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        glowPulse: {
          '0%,100%': {
            boxShadow: '0 0 0 2px rgba(217,156,74,.9), 0 0 22px rgba(217,156,74,.35)',
          },
          '50%': {
            boxShadow: '0 0 0 2px rgba(217,156,74,.5), 0 0 10px rgba(217,156,74,.15)',
          },
        },
        lampFlicker: {
          '0%,100%': { opacity: '.85' },
          '92%': { opacity: '.85' },
          '93%': { opacity: '.6' },
          '94%': { opacity: '.82' },
          '97%': { opacity: '.7' },
          '98%': { opacity: '.85' },
        },
        grainShift: {
          '0%': { transform: 'translate(0,0)' },
          '25%': { transform: 'translate(-2%,1%)' },
          '50%': { transform: 'translate(1%,-2%)' },
          '75%': { transform: 'translate(-1%,2%)' },
          '100%': { transform: 'translate(0,0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .6s ease both',
        'fade-in': 'fadeIn .5s both',
        'glow-pulse': 'glowPulse 2s infinite',
        'lamp-flicker': 'lampFlicker 9s infinite',
        grain: 'grainShift .9s steps(4) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
