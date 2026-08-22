/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          vermelho: '#C8102E',
          dourado: '#E9C169',
          'dourado-claro': '#F3D9A8',
          escuro: '#7C0E1E',
          'escuro-2': '#4A0810',
          vinho: '#5E0A15',
          texto: '#241014',
          fundo: '#FBF3EE'
        }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        titulo: ['Oswald', 'Impact', 'sans-serif'],
        corpo: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(36,16,20,0.06), 0 10px 30px rgba(36,16,20,0.07)',
        forte: '0 8px 30px rgba(124,14,30,0.25)'
      },
      backgroundImage: {
        'marca-grad': 'linear-gradient(135deg, #C8102E 0%, #7C0E1E 55%, #4A0810 100%)',
        'marca-radial': 'radial-gradient(circle at 30% 20%, #C8102E 0%, #5E0A15 70%)'
      }
    }
  },
  plugins: []
};
