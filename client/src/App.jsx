import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage'
import StartupDetailPage from './pages/StartupDetailPage'
import CreateStartupPage from './pages/CreateStartupPage'
import EditStartupPage from './pages/EditStartupPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
  }`

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
          <span className="mr-4 text-lg font-semibold text-indigo-600">DealFlow</span>
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/startups/new" className={navClass}>New Startup</NavLink>
          <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/startups/new" element={<CreateStartupPage />} />
          <Route path="/startups/:id" element={<StartupDetailPage />} />
          <Route path="/startups/:id/edit" element={<EditStartupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
