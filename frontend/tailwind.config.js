/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f6ff',
          100: '#e0edfe',
          200: '#bae0fd',
          500: '#1d63d8',
          700: '#123982',
          800: '#0f2c66',
          900: '#0c224e',
          950: '#071634'
        },
        india: {
          saffron: '#FF9933',
          green: '#138808',
          navy: '#000080'
        }
      }
    },
  },
  plugins: [],
}
