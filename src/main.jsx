import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/das.css'

// Store
import store from './store'

// Root App
import App from './App'

// Layout
import DashboardLayout from './layouts/DashboardLayout'

// Protected Route
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Archive from './pages/Archive'
import DigiDashboard from './pages/DigiDashboard'
import DataEntry from './pages/DataEntry'
import QAReview from './pages/QAReview'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import HelpSupport from './pages/Help'
import AuditLog from './pages/AuditLog'

const ALL_ROLES = ['ADMINISTRATOR', 'SCANNER_OPERATOR', 'DATA_ENTRY', 'QA_REVIEWER', 'EDITOR', 'VIEWER']

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>

      {/* Public */}
      <Route path="login" element={<Login />} />

      {/* =============================================
          DASHBOARD ROUTES (Nested under DashboardLayout)
          ============================================= */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute roles={ALL_ROLES}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Archive — all roles can view */}
        <Route path="archive" element={<Archive />} />

        {/* Digitization Command Center */}
        <Route path="digitization" element={
          <ProtectedRoute roles={['ADMINISTRATOR', 'SCANNER_OPERATOR', 'DATA_ENTRY', 'QA_REVIEWER']}>
            <DigiDashboard />
          </ProtectedRoute>
        } />

        {/* Data Entry */}
        <Route path="data-entry" element={
          <ProtectedRoute roles={['ADMINISTRATOR', 'DATA_ENTRY', 'SCANNER_OPERATOR']}>
            <DataEntry />
          </ProtectedRoute>
        } />

        {/* QA Review */}
        <Route path="qa-review" element={
          <ProtectedRoute roles={['ADMINISTRATOR', 'QA_REVIEWER']}>
            <QAReview />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="admin" element={
          <ProtectedRoute roles={['ADMINISTRATOR']}>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Audit Log — admin only */}
        <Route path="audit-log" element={
          <ProtectedRoute roles={['ADMINISTRATOR']}>
            <AuditLog />
          </ProtectedRoute>
        } />

        {/* Profile, Settings, Help — all roles */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<HelpSupport />} />

        {/* Default redirect */}
        <Route index element={<Navigate to="archive" replace />} />
      </Route>

      {/* Root redirect */}
      <Route index element={<Navigate to="/dashboard/archive" replace />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <h1 className="display-1 fw-bold text-muted">404</h1>
              <p className="lead">Page not found</p>
              <a href="/dashboard/archive" className="btn btn-das-primary">Go to Archive</a>
            </div>
          </div>
        }
      />
    </Route>
  )
)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
)