import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@visipass.com', password: 'password123', color: '#4f8ef7' },
  { label: 'Security', email: 'security@visipass.com', password: 'password123', color: '#22c55e' },
  { label: 'Host', email: 'emma@visipass.com', password: 'password123', color: '#f59e0b' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (account) => {
    setForm({ email: account.email, password: account.password });
    setLoading(true);
    try {
      await login(account.email, account.password);
      toast.success(`Logged in as ${account.label}`);
      navigate('/');
    } catch (err) {
      toast.error('Demo login failed — ensure backend is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#4f8ef7,#a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🏢</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>VisiPass</h1>
          <p style={{ fontSize: 13, color: '#5a6a88', marginTop: 4 }}>Visitor Pass Management System</p>
        </div>

        {/* Form */}
        <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8ecf4', margin: '0 0 20px' }}>Sign in to your account</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 }}>Email address</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{ width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '9px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 }}>Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '9px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #2a3347' }}>
            <p style={{ fontSize: 11, color: '#5a6a88', textAlign: 'center', marginBottom: 10 }}>Quick demo access</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  onClick={() => demoLogin(acc)}
                  disabled={loading}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${acc.color}33`, borderRadius: 8, padding: '7px 4px', color: acc.color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#5a6a88', marginTop: 16 }}>
          Default password: <code style={{ color: '#8b9ab8' }}>password123</code>
        </p>
      </div>
    </div>
  );
}
