/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mbeng: {
          bg: '#FAF7F2',
          body: '#EDE7DD',
          ink: '#241F18',
          inkSoft: '#3A3226',
          gray: '#8A8173',
          border: '#E4DCCB',
          borderLight: '#EFE9DC',
          placeholder: '#F1E7DA',
          card: '#FFFFFF',
          accent: '#C0512F',
          accentHover: '#A8452A',
          accentActive: '#8F3B24',
          accentBg: '#FBEDE6',
          // Sémantique d'état
          success: '#2F9E6E',
          successBg: '#DDF0E6',
          successSoftText: '#1F6B47',
          successSoftBg: '#F0F9F4',
          successSoftBorder: '#B9E2CC',
          warning: '#A8710A',
          warningBg: '#FBF0DC',
          warningBorder: '#F0D9A8',
          error: '#B3261E',
          errorBg: '#FBE9E7',
          errorBorder: '#F0BDB8',
          // Marques de paiement
          orange: '#FF7900',
          mtn: '#FFCC00',
          paypalDark: '#003087',
          paypalLight: '#009CDE',
          cardRed: '#EB001B',
          cardOrange: '#F79E1B'
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Work Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': '10px',
        'md': '12px',
        'lg': '14px',
        'xl': '16px',
      },
      boxShadow: {
        'focus-accent': '0 0 0 3px rgba(192, 81, 47, 0.15)',
        'focus-error': '0 0 0 3px rgba(179, 38, 30, 0.15)',
        'subtle': '0 10px 30px -10px rgba(36, 31, 24, 0.06)',
        'elevation': '0 20px 40px -15px rgba(36, 31, 24, 0.12)',
      }
    },
  },
  plugins: [],
}
