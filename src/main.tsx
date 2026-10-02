import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"

import App from "./App"
import "./index.css"
import "leaflet/dist/leaflet.css"

import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { ErrorBoundary } from "./components/common/ErrorBoundary"
import { queryClient } from "./config/queryClient"
import { PWA } from "./services/pwa.service"

// Register Service Worker for PWA & offline caching
PWA.registerServiceWorker()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary name="RootApplication">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
