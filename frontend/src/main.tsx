import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 20_000 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161B2A',
            color: '#E8E4DB',
            border: '1px solid rgba(255,255,255,0.09)',
            fontSize: '13px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
