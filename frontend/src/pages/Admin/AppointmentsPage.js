import React, { useEffect, useState, useCallback } from 'react';
import { appointmentsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  scheduled: { color: '#f59e0b', bg: '#2a1d0a' },
  confirmed: { color: '#22c55e', bg: '#0d2318' },
  completed: { color: '#4f8ef7', bg: '#1a2a4a' },
  cancelled: { color: '#ef4444', bg: '#2a0d0d' },
  no_show: { color: '#5a6a88', bg: '#1a1f2e' },
};

const INIT_FORM = {
  visitorName: '', visitorEmail: '', visitorPhone: '', visitorCompany: '',
  scheduledAt: '', duration: 60, meetingRoom: 'Conference A', purpose: '', agenda: '',
  notifyVia: { email: true, sms: false },
};

export default function AppointmentsPage() {
  const { user, hasRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.getAll();
      setAppointments(data.appointments || []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.visitorName?.trim() || !form.visitorEmail || !form.scheduledAt || !form.purpose) {
      return toast.error('Visitor name, email, date/time, and purpose are required');
    }
    setSubmitting(true);
    try {
      // Note: In a real app, visitor is looked up or created server-side
      await appointmentsAPI.create({ ...form, notifyVia: form.notifyVia });
      toast.success('Appointment scheduled and invite sent!');
      setShowModal(false);
      setForm(INIT_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create appointment');
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentsAPI.update(id, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentsAPI.delete(id);
      toast.success('Appointment cancelled');
      load();
    } catch { toast.error('Failed to cancel'); }
  };

  const FILTERS = [
    { val: 'all', label: 'All' },
    { val: 'scheduled', label: 'Scheduled' },
    { val: 'confirmed', label: 'Confirmed' },
    { val: 'completed', label: 'Completed' },
  ];

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  // Group by today / upcoming / past
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const todayAppts = filtered.filter(a => new Date(a.scheduledAt) >= todayStart && new Date(a.scheduledAt) <= todayEnd);
  const upcomingAppts = filtered.filter(a => new Date(a.scheduledAt) > todayEnd);
  const pastAppts = filtered.filter(a => new Date(a.scheduledAt) < todayStart);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>Appointments</h1>
        {hasRole('admin', 'host') && (
          <button onClick={() => setShowModal(true)} style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            📅 New Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid', borderColor: filter === f.val ? '#4f8ef7' : '#2a3347', background: filter === f.val ? '#4f8ef7' : 'transparent', color: filter === f.val ? '#fff' : '#8b9ab8' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#5a6a88' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
          {/* Today */}
          <Section title="Today" count={todayAppts.length} appointments={todayAppts} onStatus={handleStatusChange} onDelete={handleDelete} hasRole={hasRole} />
          {/* Upcoming */}
          <Section title="Upcoming" count={upcomingAppts.length} appointments={upcomingAppts} onStatus={handleStatusChange} onDelete={handleDelete} hasRole={hasRole} />
          {/* Past */}
          <Section title="Past" count={pastAppts.length} appointments={pastAppts} onStatus={handleStatusChange} onDelete={handleDelete} hasRole={hasRole} />
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Schedule Appointment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: '#6ea8ff', marginBottom: 12 }}>Visitor Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Fld label="Visitor Name *" value={form.visitorName} onChange={v => setForm({ ...form, visitorName: v })} placeholder="Full name" />
              <Fld label="Visitor Email *" type="email" value={form.visitorEmail} onChange={v => setForm({ ...form, visitorEmail: v })} placeholder="email@example.com" />
              <Fld label="Phone" value={form.visitorPhone} onChange={v => setForm({ ...form, visitorPhone: v })} placeholder="+1 555 0000" />
              <Fld label="Company" value={form.visitorCompany} onChange={v => setForm({ ...form, visitorCompany: v })} placeholder="Company" />
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: '#6ea8ff', margin: '16px 0 12px' }}>Meeting Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}><Fld label="Purpose *" value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} placeholder="Meeting purpose" /></div>
              <div><label style={lbl}>Date & Time *</label><input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Meeting Room</label>
                <select value={form.meetingRoom} onChange={e => setForm({ ...form, meetingRoom: e.target.value })} style={inp}>
                  {['Conference A', 'Conference B', 'Board Room', 'Training Room', 'Executive Suite'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Agenda / Notes</label>
              <textarea value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} rows={3} placeholder="Meeting agenda…" style={{ ...inp, resize: 'vertical' }} />
            </div>

            <div style={{ margin: '14px 0' }}>
              <label style={lbl}>Send Invite Via</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                {[['email', 'Email'], ['sms', 'SMS']].map(([k, label]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.notifyVia[k]} onChange={e => setForm({ ...form, notifyVia: { ...form.notifyVia, [k]: e.target.checked } })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 0', color: '#8b9ab8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={submitting} style={{ flex: 2, background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: submitting ? .7 : 1 }}>
                {submitting ? 'Scheduling…' : '📅 Schedule & Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, count, appointments, onStatus, onDelete, hasRole }) {
  return (
    <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <span style={{ background: '#2a3347', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#8b9ab8' }}>{count}</span>
      </div>
      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a6a88', fontSize: 12 }}>No {title.toLowerCase()} appointments</div>
      ) : appointments.map(a => {
        const st = STATUS_COLORS[a.status] || STATUS_COLORS.scheduled;
        return (
          <div key={a._id} style={{ padding: '12px 0', borderBottom: '1px solid #2a3347' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{a.visitor?.firstName} {a.visitor?.lastName}</div>
                <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 2 }}>{a.visitor?.company}</div>
                <div style={{ fontSize: 11, color: '#5a6a88', marginTop: 4 }}>
                  🕐 {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {a.meetingRoom && ` · 📍 ${a.meetingRoom}`}
                </div>
                <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 2 }}>{a.purpose}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: st.color, background: st.bg }}>{a.status}</span>
                {hasRole('admin', 'host') && a.status === 'scheduled' && (
                  <button onClick={() => onStatus(a._id, 'confirmed')} style={{ background: '#0d2318', border: '1px solid #22c55e44', borderRadius: 6, padding: '2px 8px', color: '#22c55e', fontSize: 10, cursor: 'pointer' }}>Confirm</button>
                )}
                {hasRole('admin', 'host') && (
                  <button onClick={() => onDelete(a._id)} style={{ background: 'none', border: 'none', color: '#5a6a88', fontSize: 12, cursor: 'pointer' }}>✕</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Fld({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };
const inp = { width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
