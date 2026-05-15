import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function PreRegisterPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appt, setAppt] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', company: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }
    appointmentsAPI
      .getPreRegister(token)
      .then((res) => {
        setAppt(res.data.appointment);
        const v = res.data.appointment?.visitor;
        if (v) {
          setForm({
            firstName: v.firstName || '',
            lastName: v.lastName || '',
            phone: v.phone || '',
            company: v.company || '',
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load invitation.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error('First and last name are required.');
    }
    setSubmitting(true);
    try {
      await appointmentsAPI.submitPreRegister(token, form);
      toast.success('You are confirmed for this visit.');
      setAppt((a) => (a ? { ...a, status: 'confirmed' } : a));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = { minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif" };
  const card = { background: '#161b27', border: '1px solid #2a3347', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center', color: '#8b9ab8' }}>Loading invitation…</div>
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <h1 style={{ fontSize: 18, color: '#e8ecf4', margin: 0 }}>Invitation unavailable</h1>
          <p style={{ fontSize: 13, color: '#8b9ab8', marginTop: 8 }}>{error || 'Try again later.'}</p>
          <Link to="/login" style={{ display: 'inline-block', marginTop: 20, color: '#6ea8ff', fontSize: 13 }}>Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (appt.status === 'confirmed' || appt.status === 'completed') {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 18, color: '#e8ecf4', margin: 0 }}>You are all set</h1>
          <p style={{ fontSize: 13, color: '#8b9ab8', marginTop: 8 }}>This visit is already confirmed.</p>
          <p style={{ fontSize: 12, color: '#5a6a88', marginTop: 16 }}>
            {new Date(appt.scheduledAt).toLocaleString()} · {appt.meetingRoom || 'TBD'}
          </p>
          <Link to="/login" style={{ display: 'inline-block', marginTop: 20, color: '#6ea8ff', fontSize: 13 }}>Sign in (if you have an account)</Link>
        </div>
      </div>
    );
  }

  const inp = { width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '9px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e8ecf4', margin: '0 0 6px' }}>Pre-register for your visit</h1>
        <p style={{ fontSize: 12, color: '#5a6a88', marginBottom: 18 }}>
          Hosted by <strong style={{ color: '#8b9ab8' }}>{appt.host?.name}</strong>
          {appt.host?.department ? ` · ${appt.host.department}` : ''}
        </p>

        <div style={{ background: '#1e2535', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12, color: '#8b9ab8' }}>
          <div><strong style={{ color: '#e8ecf4' }}>When:</strong> {new Date(appt.scheduledAt).toLocaleString()}</div>
          <div style={{ marginTop: 6 }}><strong style={{ color: '#e8ecf4' }}>Where:</strong> {appt.meetingRoom || 'TBD'}</div>
          <div style={{ marginTop: 6 }}><strong style={{ color: '#e8ecf4' }}>Purpose:</strong> {appt.purpose}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>First name *</label>
              <input style={inp} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Last name *</label>
              <input style={inp} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Phone</label>
              <input style={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Company</label>
              <input style={inp} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', marginTop: 18, background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1 }}
          >
            {submitting ? 'Submitting…' : 'Confirm registration'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#5a6a88', marginTop: 16, textAlign: 'center' }}>VisiPass visitor management</p>
      </div>
    </div>
  );
}
