import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { section: 'Overview', items: [{ to: '/', icon: '📊', label: 'Dashboard', exact: true }, { to: '/reports', icon: '📈', label: 'Reports' }] },
    { section: 'Management', items: [{ to: '/visitors', icon: '👥', label: 'Visitors' }, { to: '/passes', icon: '🎫', label: 'Passes' }, { to: '/appointments', icon: '📅', label: 'Appointments' }] },
    { section: 'Operations', items: [{ to: '/checkinout', icon: '🚪', label: 'Check In / Out' }, { to: '/users', icon: '👤', label: 'User Management' }, { to: '/settings', icon: '⚙️', label: 'Settings' }] },
  ],
  security: [
    { section: 'Main', items: [{ to: '/checkinout', icon: '🚪', label: 'Check In / Out' }, { to: '/visitors', icon: '👥', label: 'Visitors' }, { to: '/passes', icon: '🎫', label: 'Passes' }] },
  ],
  host: [
    { section: 'Main', items: [{ to: '/', icon: '📊', label: 'Dashboard', exact: true }, { to: '/appointments', icon: '📅', label: 'Appointments' }, { to: '/visitors', icon: '👥', label: 'My Visitors' }] },
  ],
  visitor: [
    { section: 'My Account', items: [{ to: '/my-pass', icon: '🎫', label: 'My Pass' }, { to: '/appointments', icon: '📅', label: 'Appointments' }] },
  ],
};

const ROLE_COLORS = { admin: '#4f8ef7', security: '#22c55e', host: '#f59e0b', visitor: '#a855f7' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navSections = NAV_ITEMS[user?.role] || NAV_ITEMS.host;
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', color: '#e8ecf4', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220, minWidth: 220, background: '#161b27', borderRight: '1px solid #2a3347',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
        transition: 'transform .3s',
      }}
        className={`sidebar-el${sidebarOpen ? ' open' : ''}`}
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #2a3347' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏢</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.5px' }}>VISIPASS</div>
              <div style={{ fontSize: 10, color: '#5a6a88' }}>Pass Management</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ margin: '10px 10px 6px', padding: '8px 10px', background: '#1a2a4a', border: '1px solid #4f8ef7', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#8b9ab8', textTransform: 'uppercase', letterSpacing: '.5px' }}>Signed in as</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLORS[user?.role], marginTop: 2 }}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 8px', overflowY: 'auto' }}>
          {navSections.map((section) => (
            <div key={section.section}>
              <div style={{ fontSize: 10, color: '#5a6a88', textTransform: 'uppercase', letterSpacing: '.5px', padding: '10px 10px 4px' }}>
                {section.section}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, textDecoration: 'none',
                    color: isActive ? '#6ea8ff' : '#8b9ab8',
                    background: isActive ? '#1a2a4a' : 'transparent',
                    border: isActive ? '1px solid rgba(79,142,247,.2)' : '1px solid transparent',
                    margin: '1px 0', transition: 'all .15s',
                  })}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User chip */}
        <div style={{ padding: 10, borderTop: '1px solid #2a3347' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#1e2535', borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a2a4a', color: '#6ea8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: '#5a6a88' }}>{user?.department}</div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a6a88', fontSize: 14, padding: 4 }}>⏻</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content">
        {/* Topbar */}
        <header style={{ background: '#161b27', borderBottom: '1px solid #2a3347', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
          <button
            className="menu-btn-mobile"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b9ab8', fontSize: 18, padding: 6, borderRadius: 6, display: 'none' }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#5a6a88' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a2a4a', color: '#6ea8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 20, maxWidth: '100%', overflow: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-el { transform: translateX(-220px) !important; }
          .sidebar-el.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .menu-btn-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
