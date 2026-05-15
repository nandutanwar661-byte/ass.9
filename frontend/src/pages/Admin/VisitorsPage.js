import React, { useEffect, useState, useCallback } from 'react';
import { visitorsAPI, usersAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#2a1d0a' },
  approved: { label: 'Approved', color: '#14b8a6', bg: '#0a1f1e' },
  checked_in: { label: 'Inside', color: '#22c55e', bg: '#0d2318' },
  checked_out: { label: 'Checked Out', color: '#4f8ef7', bg: '#1a2a4a' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#2a0d0d' },
};

const tag = (status) => {
  const s = STATUS[status] || STATUS.pending;
  return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg }}>{s.label}</span>;
};

const INIT_FORM = {
  firstName: '', lastName: '', email: '', phone: '', company: '',
  idType: 'national_id', idNumber: '', host: '', department: 'Engineering',
  purpose: 'meeting', visitDate: new Date().toISOString().split('T')[0],
  expectedDuration: 4, notes: '', photo: null,
};

export default function VisitorsPage() {
  const { hasRole } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const { data } = await visitorsAPI.getAll(params);
      setVisitors(data.visitors || []);
    } catch {
      toast.error('Failed to load visitors');
    } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { usersAPI.getHostsList().then((r) => setHosts(r.data.users || [])).catch(() => {}); }, []);

  const handleApprove = async (id) => {
    try {
      await visitorsAPI.approve(id);
      toast.success('Visitor approved');
      load();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this visitor?')) return;
    try {
      await visitorsAPI.reject(id);
      toast.success('Visitor rejected');
      load();
    } catch { toast.error('Failed to reject'); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });
      await visitorsAPI.create(fd);
      toast.success('Visitor registered successfully!');
      setShowModal(false);
      setForm(INIT_FORM);
      setStep(1);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const FILTERS = [
    { val: 'all', label: 'All' }, { val: 'pending', label: 'Pending' },
    { val: 'checked_in', label: 'Inside' }, { val: 'checked_out', label: 'Checked Out' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>Visitors</h1>
        <button onClick={() => { setShowModal(true); setStep(1); }} style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ＋ Register Visitor
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid', borderColor: filter === f.val ? '#4f8ef7' : '#2a3347', background: filter === f.val ? '#4f8ef7' : 'transparent', color: filter === f.val ? '#fff' : '#8b9ab8', transition: 'all .15s' }}>
              {f.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitors…"
          style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '7px 12px', color: '#e8ecf4', fontSize: 12, outline: 'none', minWidth: 200 }} />
      </div>

      {/* Table */}
      <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Visitor', 'Company', 'Host', 'Department', 'Purpose', 'Visit Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#5a6a88', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #2a3347', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#5a6a88' }}>Loading…</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#5a6a88' }}>No visitors found</td></tr>
              ) : visitors.map(v => (
                <tr key={v._id} style={{ borderBottom: '1px solid rgba(42,51,71,.4)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2a4a', color: '#6ea8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {v.firstName?.[0]}{v.lastName?.[0]}
                      </div>
                      <div>
                        <div>{v.firstName} {v.lastName}</div>
                        <div style={{ fontSize: 10, color: '#5a6a88' }}>{v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{v.company || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{v.host?.name || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{v.department}</td>
                  <td style={{ padding: '10px 12px', color: '#8b9ab8', textTransform: 'capitalize' }}>{v.purpose?.replace('_', ' ')}</td>
                  <td style={{ padding: '10px 12px', color: '#8b9ab8', whiteSpace: 'nowrap' }}>{new Date(v.visitDate).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 12px' }}>{tag(v.status)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {v.status === 'pending' && hasRole('admin', 'host', 'security') && (
                        <>
                          <button onClick={() => handleApprove(v._id)} style={{ background: '#0d2318', border: '1px solid #22c55e', borderRadius: 6, padding: '3px 8px', color: '#22c55e', fontSize: 11, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => handleReject(v._id)} style={{ background: '#2a0d0d', border: '1px solid #ef4444', borderRadius: 6, padding: '3px 8px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </>
                      )}
                      <button style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 6, padding: '3px 8px', color: '#8b9ab8', fontSize: 11, cursor: 'pointer' }}>🎫</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Register New Visitor</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', marginBottom: 22 }}>
              {['Personal Info', 'Visit Details', 'Confirm'].map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step > i + 1 ? '#4f8ef7' : step === i + 1 ? 'transparent' : 'transparent', border: `2px solid ${step >= i + 1 ? '#4f8ef7' : '#2a3347'}`, color: step >= i + 1 ? '#6ea8ff' : '#5a6a88' }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: step >= i + 1 ? '#6ea8ff' : '#5a6a88' }}>{s}</div>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div>
                <Row><Field label="First Name" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} placeholder="First name" /></Row>
                <Row><Field label="Last Name" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} placeholder="Last name" /></Row>
                <Row><Field label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="visitor@email.com" /></Row>
                <Row><Field label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+1 555 0000" /></Row>
                <Row><Field label="Company" value={form.company} onChange={v => setForm({ ...form, company: v })} placeholder="Company name" /></Row>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lblStyle}>ID Type</label>
                    <select value={form.idType} onChange={e => setForm({ ...form, idType: e.target.value })} style={inpStyle}>
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="driver_license">Driver License</option>
                    </select>
                  </div>
                  <Field label="ID Number" value={form.idNumber} onChange={v => setForm({ ...form, idNumber: v })} placeholder="ID number" />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={lblStyle}>Photo (optional)</label>
                  <input type="file" accept="image/*" onChange={e => setForm({ ...form, photo: e.target.files[0] })} style={{ ...inpStyle, padding: '6px 12px' }} />
                </div>
                <button onClick={() => { if (!form.firstName || !form.email) { toast.error('Please fill required fields'); return; } setStep(2); }} style={btnStyle}>Next →</button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lblStyle}>Host Employee</label>
                  <select value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} style={inpStyle}>
                    <option value="">Select host…</option>
                    {hosts.map(h => <option key={h._id} value={h._id}>{h.name} ({h.department})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div><label style={lblStyle}>Department</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inpStyle}>
                      {['Engineering', 'HR', 'Finance', 'Legal', 'Administration', 'Marketing', 'Operations'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label style={lblStyle}>Purpose</label>
                    <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} style={inpStyle}>
                      {['meeting', 'interview', 'delivery', 'maintenance', 'vendor', 'other'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <Field label="Visit Date" type="date" value={form.visitDate} onChange={v => setForm({ ...form, visitDate: v })} />
                  <div><label style={lblStyle}>Duration (hours)</label>
                    <input type="number" min="1" max="12" value={form.expectedDuration} onChange={e => setForm({ ...form, expectedDuration: e.target.value })} style={inpStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lblStyle}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Special requirements…" rows={3} style={{ ...inpStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'transparent', border: '1px solid #2a3347', color: '#8b9ab8', flex: 1 }}>← Back</button>
                  <button onClick={() => { if (!form.host) { toast.error('Please select a host'); return; } setStep(3); }} style={{ ...btnStyle, flex: 1 }}>Next →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Ready to Register</div>
                <div style={{ background: '#1e2535', borderRadius: 10, padding: 16, textAlign: 'left', marginBottom: 18 }}>
                  {[['Name', `${form.firstName} ${form.lastName}`], ['Email', form.email], ['Company', form.company || '—'], ['Department', form.department], ['Purpose', form.purpose], ['Visit Date', form.visitDate]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#5a6a88' }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'transparent', border: '1px solid #2a3347', color: '#8b9ab8', flex: 1 }}>← Back</button>
                  <button onClick={handleSubmit} disabled={submitting} style={{ ...btnStyle, background: '#22c55e', flex: 1 }}>{submitting ? 'Registering…' : '✓ Register & Issue Pass'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const lblStyle = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };
const inpStyle = { width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const btnStyle = { width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 14 };

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lblStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inpStyle} />
    </div>
  );
}
function Row({ children }) { return <div>{children}</div>; }
