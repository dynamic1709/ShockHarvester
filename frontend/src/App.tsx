import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import WatchlistSidebar from './components/WatchlistSidebar'
import AskAngelModal from './components/AskAngelModal'

import LoginPage from './pages/LoginPage'
import MarketsPage from './pages/MarketsPage'
import TradeOnePage from './pages/TradeOnePage'
import PortfolioPage from './pages/PortfolioPage'
import OrdersPage from './pages/OrdersPage'
import PositionsPage from './pages/PositionsPage'
import ShockHarvesterPage from './pages/ShockHarvesterPage'
import TaxPage from './pages/TaxPage'
import ClientsPage from './pages/ClientsPage'
import SecuritiesPage from './pages/SecuritiesPage'

import './index.css'

function AuthGuard() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d10' }}>
        <div style={{ color: '#387ed1', fontWeight: 600 }}>Loading Angel One ShockHarvester...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function MainLayout() {
  const [selectedStock, setSelectedStock] = useState('NIFTY')
  
  // Show Watchlist on TradeOne and Portfolio by default (or collapsible everywhere)
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body */}
      <div className="app-body">
        {/* Left Watchlist Sidebar */}
        <WatchlistSidebar 
          selectedSymbol={selectedStock}
          onSelectStock={(s) => setSelectedStock(s.symbol)}
        />

        {/* Dynamic Main Viewport */}
        <main className="main-viewport">
          <Outlet />
        </main>
      </div>

      {/* Floating Ask Angel AI */}
      <AskAngelModal />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/markets" replace />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/tradeone" element={<TradeOnePage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/positions" element={<PositionsPage />} />
              <Route path="/shock-harvester" element={<ShockHarvesterPage />} />
              <Route path="/tax" element={<TaxPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/securities" element={<SecuritiesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/markets" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
