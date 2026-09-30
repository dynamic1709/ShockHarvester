import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './pages/LoginPage'
import ClientLayout from './layouts/ClientLayout'
import AdvisorLayout from './layouts/AdvisorLayout'

import ClientHomePage from './pages/client/ClientHomePage'
import ClientWatchlistPage from './pages/client/ClientWatchlistPage'
import ClientStockDetailPage from './pages/client/ClientStockDetailPage'
import ClientPortfolioPage from './pages/client/ClientPortfolioPage'
import ClientTaxPage from './pages/client/ClientTaxPage'
import ClientActivityPage from './pages/client/ClientActivityPage'
import ClientProfilePage from './pages/client/ClientProfilePage'

import {
  AdvisorCommandCenterPage,
  AdvisorClientsPage,
  AdvisorRunsPage,
  AdvisorBacktestPage,
  AdvisorGuardrailsPage,
  AdvisorTaxRulesPage,
  AdvisorSettingsPage,
} from './pages/advisor'

import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

function AuthGuard() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d14',
        color: '#10b981',
        fontWeight: 600,
        fontSize: '15px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Initializing ShockHarvester...
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RoleHomeRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'advisor') return <Navigate to="/advisor" replace />
  return <Navigate to="/app" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<AuthGuard />}>
                <Route path="/" element={<RoleHomeRedirect />} />

                {/* Client App Shell */}
                <Route path="/app" element={<ClientLayout />}>
                  <Route index element={<ClientHomePage />} />
                  <Route path="watchlist" element={<ClientWatchlistPage />} />
                  <Route path="stocks/:symbol" element={<ClientStockDetailPage />} />
                  <Route path="portfolio" element={<ClientPortfolioPage />} />
                  <Route path="tax" element={<ClientTaxPage />} />
                  <Route path="activity" element={<ClientActivityPage />} />
                  <Route path="profile" element={<ClientProfilePage />} />
                </Route>

                {/* Advisor Console Shell */}
                <Route path="/advisor" element={<AdvisorLayout />}>
                  <Route index element={<AdvisorCommandCenterPage />} />
                  <Route path="clients" element={<AdvisorClientsPage />} />
                  <Route path="runs" element={<AdvisorRunsPage />} />
                  <Route path="backtest" element={<AdvisorBacktestPage />} />
                  <Route path="guardrails" element={<AdvisorGuardrailsPage />} />
                  <Route path="tax-rules" element={<AdvisorTaxRulesPage />} />
                  <Route path="settings" element={<AdvisorSettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<RoleHomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
