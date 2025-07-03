/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Crimson Pro', 'serif'],
        'serif': ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
};
