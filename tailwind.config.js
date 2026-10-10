export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#efebe9',
          100: '#d7ccc8',
          200: '#bcaaa4',
          300: '#a1887f',
          400: '#8d6e63',
          500: '#795548',
          600: '#6d4c41',
          700: '#5d4037',
          800: '#4e342e',
          900: '#3e2723',
        }
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'bomb-shake': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-4px, 2px) rotate(-1.5deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(4px, -2px) rotate(1.5deg)' },
        },
        'violent-earthquake': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '5%': { transform: 'translate(-14px, 8px) scale(1.08) rotate(-4deg)' },
          '10%': { transform: 'translate(14px, -10px) scale(1.08) rotate(4deg)' },
          '15%': { transform: 'translate(-10px, -8px) scale(1.06) rotate(-3deg)' },
          '20%': { transform: 'translate(12px, 8px) scale(1.05) rotate(3deg)' },
          '25%': { transform: 'translate(-8px, 6px) scale(1.04) rotate(-2deg)' },
          '35%': { transform: 'translate(8px, -6px) scale(1.03) rotate(2deg)' },
          '45%': { transform: 'translate(-6px, 4px) scale(1.02) rotate(-1.5deg)' },
          '60%': { transform: 'translate(4px, -4px) scale(1.01) rotate(1deg)' },
          '80%': { transform: 'translate(-2px, 2px) scale(1) rotate(-0.5deg)' },
          '100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        },
        'shockwave-ring': {
          '0%': { transform: 'scale(0.2)', opacity: '1', borderWidth: '8px' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'scale(2.8)', opacity: '0', borderWidth: '1px' },
        },
        'explosion-flash': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '15%': { opacity: '0.95', transform: 'scale(1.05)' },
          '40%': { opacity: '0.7' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        'smoke-billow': {
          '0%': { transform: 'translateY(0) scale(0.7) rotate(0deg)', opacity: '0.8' },
          '100%': { transform: 'translateY(-35px) scale(1.4) rotate(25deg)', opacity: '0' },
        },
        'fuse-spark': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px #fbbf24) scale(1)', opacity: '1' },
          '50%': { filter: 'drop-shadow(0 0 12px #ef4444) scale(1.3)', opacity: '0.8' },
        }
      },
      animation: {
        marquee: 'marquee 150s linear infinite',
        'bomb-shake': 'bomb-shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'violent-shake': 'violent-earthquake 1.3s cubic-bezier(.25,.8,.25,1) both',
        'shockwave-ring': 'shockwave-ring 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
        'explosion-flash': 'explosion-flash 0.9s cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
        'smoke-billow': 'smoke-billow 2.2s ease-out infinite',
        'fuse-spark': 'fuse-spark 0.3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
