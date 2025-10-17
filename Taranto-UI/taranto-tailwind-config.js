// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/taranto-ui/src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'taranto-turquoise': '#00ABC8',
        'taranto-green': '#80BC00',
        'taranto-orange': '#f05423',
        'taranto-red': '#dc2626',
        'taranto-grey': '#4d4d4f',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      spacing: {
        'taranto-compact': '0.75rem',
        'taranto-comfortable': '1rem',
        'taranto-spacious': '1.5rem',
      },
      borderRadius: {
        'taranto': '0.5rem', // 8px - standard for all components
      },
      boxShadow: {
        'taranto-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'taranto-elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

// src/styles/globals.css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1, h2, h3, h4, h5, h6 {
    @apply font-poppins;
  }

  body {
    @apply font-roboto;
  }
}

@layer components {
  /* Taranto specific utilities */
  .taranto-heading {
    @apply font-poppins font-bold text-taranto-grey;
  }

  .taranto-body {
    @apply font-roboto text-taranto-grey;
  }

  .taranto-btn-base {
    @apply rounded-lg font-medium font-roboto inline-flex items-center gap-2 transition-all duration-200;
  }

  .taranto-input-base {
    @apply px-4 py-2 w-full font-roboto transition-all duration-200 outline-none;
  }

  .taranto-card-base {
    @apply rounded-lg p-4;
  }
}