module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: { extend: {
    fontFamily: { sans: ['Kanit', 'sans-serif'] },
    colors: {
      coral: { 50: '#fff5f3', 100: '#ffe8e4', 400: '#f07c69', 500: '#E05A47', 600: '#cc4230' },
      cream: { 100: '#F9F8F6', 200: '#E8E6DB' }
    }
  } },
  plugins: []
};
