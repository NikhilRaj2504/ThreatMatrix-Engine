/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#0B101E',        // Deep Void Blue
          surface: '#151B2B',   // Abyss Slate
          border: '#262F43',    // Subtle Steel
          text: '#F8FAFC',      // Clean Off-white
          muted: '#94A3B8',     // Muted Slate
          teal: '#00D2D3',      // Solid Electric Teal
          green: '#2ED573',     // Solid Mint Green
          orange: '#FFA502',    // Solid Alert Orange
          red: '#FF4757',       // Solid Threat Crimson
          blue: '#1E90FF',      // Solid Dodger Blue
        }
      }
    },
  },
  plugins: [],
}
