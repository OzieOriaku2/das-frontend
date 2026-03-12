import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  FiHome, FiTarget, FiClipboard, FiCheckCircle, FiLayers,
  FiSettings, FiLogOut, FiChevronDown, FiMenu, FiX,
  FiBell, FiUser, FiHelpCircle, FiClock,
} from 'react-icons/fi'
import { toast } from 'react-toastify'
import { selectCurrentUser, logout } from '../slices/authSlice'

// Sidebar navigation config
const buildSidebarNav = (role) => {
  const canEntry = ['ADMINISTRATOR', 'DATA_ENTRY', 'SCANNER_OPERATOR'].includes(role)
  const canQA = ['ADMINISTRATOR', 'QA_REVIEWER'].includes(role)
  const isAdmin = role === 'ADMINISTRATOR'

  return [
    { section: 'Records' },
    { path: '/dashboard/archive', icon: FiLayers, label: 'Archive' },
    { section: 'Digitization', show: canEntry || canQA },
    { path: '/dashboard/digitization', icon: FiTarget, label: 'Command Center', show: canEntry || canQA },
    { path: '/dashboard/data-entry', icon: FiClipboard, label: 'Data Entry', show: canEntry },
    { path: '/dashboard/qa-review', icon: FiCheckCircle, label: 'QA Review', show: canQA },
    { section: 'System', show: isAdmin },
    { path: '/dashboard/admin', icon: FiSettings, label: 'Administration', show: isAdmin },
    { path: '/dashboard/audit-log', icon: FiClock, label: 'Audit Log', show: isAdmin },
  ].filter(item => item.show !== false)
}

// Page title mapping
const pageTitles = {
  '/dashboard/archive': { title: 'Archive', desc: 'Browse and manage committed CofO records', icon: FiLayers },
  '/dashboard/digitization': { title: 'Digitization', desc: 'Pipeline progress and command center', icon: FiTarget },
  '/dashboard/data-entry': { title: 'Data Entry', desc: 'Index scanned case files', icon: FiClipboard },
  '/dashboard/qa-review': { title: 'QA Review', desc: 'Verify and approve indexed records', icon: FiCheckCircle },
  '/dashboard/admin': { title: 'Administration', desc: 'Manage users, offices, and system settings', icon: FiSettings },
  '/dashboard/audit-log': { title: 'Audit Log', desc: 'System-wide activity trail', icon: FiClock },
  '/dashboard/profile': { title: 'My Profile', desc: 'Account details and security', icon: FiUser },
  '/dashboard/settings': { title: 'Settings', desc: 'System configuration', icon: FiSettings },
  '/dashboard/help': { title: 'Help & Support', desc: 'Guides, documentation, and contact', icon: FiHelpCircle },
}

const DashboardLayout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(selectCurrentUser)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef(null)
  const notifRef = useRef(null)

  const sidebarNav = buildSidebarNav(user?.role)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const getPageMeta = () => {
    for (const [path, meta] of Object.entries(pageTitles)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) return meta
    }
    return { title: 'Dashboard', desc: '', icon: FiHome }
  }

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pageMeta = getPageMeta()
  const PageIcon = pageMeta.icon

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard/archive" className="sidebar-brand">
            <div className="brand-logo">
              <img src="/logo-34.png" alt="DAS" width={20} height={20} style={{ objectFit: 'contain' }} />
            </div>
            {sidebarOpen && (
              <div className="brand-text">
                <span className="brand-name">DAS</span>
                <span className="brand-sub">Digital Archiving System</span>
              </div>
            )}
          </Link>
          <button className="sidebar-toggle d-none d-lg-flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiChevronDown style={{ transform: sidebarOpen ? 'rotate(90deg)' : 'rotate(-90deg)' }} />
          </button>
          <button className="sidebar-close d-lg-none" onClick={() => setMobileMenuOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarNav.map((item, index) =>
            item.section ? (
              <div key={index} className="nav-section-label">{item.section}</div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="nav-icon" />
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
          {sidebarOpen && (
            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'User'}</div>
                <div className="sidebar-user-role">{user?.role?.replace(/_/g, ' ') || 'Role'}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarOpen ? '' : 'expanded'}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn d-lg-none" onClick={() => setMobileMenuOpen(true)}>
              <FiMenu />
            </button>
            <div className="header-page-info">
              <div className="header-page-icon">
                <PageIcon />
              </div>
              <div>
                <h1 className="page-title">{pageMeta.title}</h1>
                <p className="page-subtitle">{user?.office?.name || 'All Offices'}{pageMeta.desc && ` · ${pageMeta.desc}`}</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="header-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}>
                <FiBell />
                <span className="notification-dot" />
              </button>
              {showNotifications && (
                <div className="user-dropdown fade-in" style={{ width: 300, right: 0 }}>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--das-gray-200)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--das-primary)', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--das-gray-200)', fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 500 }}>QA queue has pending reviews</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)', marginTop: 2 }}>2 min ago</div>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--das-gray-200)', fontSize: '0.8125rem' }}>
                    <div style={{ fontWeight: 500 }}>3 new cases scanned</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)', marginTop: 2 }}>1 hour ago</div>
                  </div>
                  <div style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>
                    <span onClick={() => { setShowNotifications(false); navigate('/dashboard/audit-log') }} style={{ fontSize: '0.75rem', color: 'var(--das-primary)', fontWeight: 600, cursor: 'pointer' }}>View all activity</span>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="header-icon-btn" onClick={() => navigate('/dashboard/settings')}><FiSettings /></button>

            {/* Profile */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button className="user-menu-btn" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}>
                <div className="user-avatar">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <span className="user-name d-none d-md-block">{user?.name || 'User'}</span>
                <FiChevronDown size={14} color="var(--das-gray-400)" />
              </button>
              {showUserMenu && (
                <div className="user-dropdown fade-in">
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--das-gray-200)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>{user?.office?.name} · {user?.role?.replace(/_/g, ' ')}</div>
                  </div>
                  <div style={{ padding: '0.25rem 0' }}>
                    <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/dashboard/profile') }}>
                      <FiUser size={16} /> My Profile
                    </button>
                    <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/dashboard/settings') }}>
                      <FiSettings size={16} /> Settings
                    </button>
                    <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/dashboard/help') }}>
                      <FiHelpCircle size={16} /> Help & Support
                    </button>
                  </div>
                  <div className="dropdown-divider" />
                  <div style={{ padding: '0.25rem 0' }}>
                    <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--das-danger)' }}>
                      <FiLogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout