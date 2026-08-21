/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          vermelho: '#C8102E',
          dourado: '#E9C169',
          escuro: '#7C0E1E',
          texto: '#241014',
          fundo: '#FFF7F3'
        }
      },
      fontFamily: {
        titulo: ['Oswald', 'Impact', 'sans-serif'],
        corpo: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(36,16,20,0.08), 0 8px 24px rgba(36,16,20,0.06)'
      }
    }
  },
  plugins: []
};
