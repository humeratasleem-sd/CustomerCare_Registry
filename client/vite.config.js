import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ['react', 'react-dom', 'react-router-dom'],
          uiVendor: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          chartVendor: ['chart.js', 'react-chartjs-2'],
          utilityVendor: ['axios', 'jspdf', 'jspdf-autotable', 'xlsx', 'socket.io-client', 'react-toastify']
        }
      }
    }
  }
})
