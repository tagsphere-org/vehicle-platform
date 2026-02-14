import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">TagSphere</Link>
          <div className="navbar-links">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                <button
                  onClick={logout}
                  className="navbar-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="navbar-link">Login</Link>
            )}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
