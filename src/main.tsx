import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CategoryProvider } from './context/CategoryContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LocationProvider>
        <CategoryProvider>
          <App />
        </CategoryProvider>
      </LocationProvider>
    </AuthProvider>
  </React.StrictMode>,
)
