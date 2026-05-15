// ═══════════════════════════════════════════════════════════
// UsersPage.js
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../utils/api';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ROLES = { admin: { color: '#4f8ef7', bg: '#1a2a4a' }, security: { color: '#22c55e', bg: '#0d2318' }, host: { color: '#f59e0b', bg: '#2a1d0a' }, visitor: { color: '#a855f7', bg: '#1e1030' } };

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'host', department: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await usersAPI.getAll(); setUsers(data.users || []); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await authAPI.register(form);
      toast.success('User created');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'host', department: '', phone: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await usersAPI.delete(id); toast.success('User deleted'); load(); }
    catch { toast.error('Failed to delete user'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>User Management</h1>
        <button onClick={() => setShowModal(true)} style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>＋ Add User</button>
      </div>

      <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['User', 'Email', 'Role', 'Department', 'Last Login', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#5a6a88', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #2a3347', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#5a6a88' }}>Loading…</td></tr>
                : users.map(u => {
                  const r = ROLES[u.role] || ROLES.host;
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(42,51,71,.4)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                            {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: r.color, background: r.bg, textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{u.department || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#5a6a88' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => handleDelete(u._id)} style={{ background: '#2a0d0d', border: '1px solid #ef444444', borderRadius: 6, padding: '3px 8px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Add New User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {[['Name', 'name', 'text', 'Full name'], ['Email', 'email', 'email', 'user@email.com'], ['Password', 'password', 'password', '••••••••'], ['Phone', 'phone', 'tel', '+1 555 0000'], ['Department', 'department', 'text', 'Department']].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                  style={{ width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5 }}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                <option value="admin">Admin</option><option value="security">Security</option><option value="host">Host</option><option value="visitor">Visitor</option>
              </select>
            </div>
            <button onClick={handleCreate} disabled={submitting} style={{ width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
