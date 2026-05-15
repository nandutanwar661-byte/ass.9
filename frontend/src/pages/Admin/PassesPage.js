import React, { useEffect, useState, useCallback } from 'react';
import { passesAPI, visitorsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS = {
  active: { label: 'Active', color: '#22c55e', bg: '#0d2318' },
  used: { label: 'Used', color: '#4f8ef7', bg: '#1a2a4a' },
  expired: { label: 'Expired', color: '#5a6a88', bg: '#1a1f2e' },
  revoked: { label: 'Revoked', color: '#ef4444', bg: '#2a0d0d' },
};

const BADGE_COLORS = { standard: '#4f8ef7', vip: '#a855f7', contractor: '#f59e0b', delivery: '#22c55e' };

export default function PassesPage() {
  const [passes, setPasses] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    visitor: '', validFrom: '', validUntil: '',
    accessLevel: 'standard', badgeType: 'standard',
    notifyEmail: true, notifySMS: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await passesAPI.getAll();
      setPasses(data.passes || []);
    } catch { toast.error('Failed to load passes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    visitorsAPI.getAll({ limit: 100 }).then(r => setVisitors(r.data.visitors || [])).catch(() => {});
  }, []);

  const handleIssue = async () => {
    if (!form.visitor || !form.validFrom || !form.validUntil) {
      return toast.error('Please fill all required fields');
    }
    setSubmitting(true);
    try {
      await passesAPI.issue(form);
      toast.success('Pass issued successfully!');
      setShowModal(false);
      setForm({ visitor: '', validFrom: '', validUntil: '', accessLevel: 'standard', badgeType: 'standard', notifyEmail: true, notifySMS: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue pass');
    } finally { setSubmitting(false); }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this pass?')) return;
    try {
      await passesAPI.revoke(id, 'Manually revoked');
      toast.success('Pass revoked');
      load();
    } catch { toast.error('Failed to revoke pass'); }
  };

  const handleDownload = async (id, passId) => {
    try {
      const { data } = await passesAPI.downloadPDF(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `pass-${passId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF download failed'); }
  };

  // Set default valid times (today 8am – 6pm)
  const setDefaultTimes = () => {
    const now = new Date();
    const from = new Date(now); from.setHours(8, 0, 0, 0);
    const until = new Date(now); until.setHours(18, 0, 0, 0);
    setForm(f => ({
      ...f,
      validFrom: from.toISOString().slice(0, 16),
      validUntil: until.toISOString().slice(0, 16),
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>Pass Management</h1>
        <button onClick={() => { setShowModal(true); setDefaultTimes(); }}
          style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          🎫 Issue New Pass
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS).map(([key, s]) => {
          const count = passes.filter(p => p.status === key).length;
          return (
            <div key={key} style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 8, padding: '6px 14px', fontSize: 12 }}>
              <span style={{ color: s.color, fontWeight: 700 }}>{count}</span>
              <span style={{ color: '#8b9ab8', marginLeft: 6 }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Pass cards grid */}
      {loading ? (
        <div style={{ color: '#5a6a88', textAlign: 'center', padding: 40 }}>Loading passes…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {passes.length === 0 ? (
            <div style={{ color: '#5a6a88', padding: 40, gridColumn: '1/-1', textAlign: 'center' }}>No passes found</div>
          ) : passes.map(p => {
            const st = STATUS[p.status] || STATUS.expired;
            const visitor = p.visitor;
            const badgeColor = BADGE_COLORS[p.badgeType] || '#4f8ef7';
            return (
              <div key={p._id} style={{ background: 'linear-gradient(135deg, #1e2535, #1a2a4a)', border: `1px solid ${badgeColor}44`, borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: badgeColor }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, color: badgeColor, background: `${badgeColor}22`, textTransform: 'uppercase' }}>{p.badgeType}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {visitor?.firstName?.[0]}{visitor?.lastName?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{visitor?.firstName} {visitor?.lastName}</div>
                    <div style={{ fontSize: 11, color: '#8b9ab8' }}>{visitor?.company || 'Individual'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    ['Pass ID', p.passId],
                    ['Host', visitor?.host?.name || '—'],
                    ['Valid From', new Date(p.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
                    ['Valid Until', new Date(p.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
                    ['Access', p.accessLevel?.toUpperCase()],
                    ['Issued By', p.issuedBy?.name || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: '#5a6a88' }}>{k}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 1 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar validity */}
                <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, marginBottom: 14 }}>
                  <div style={{ height: '100%', width: p.status === 'active' ? '60%' : p.status === 'used' ? '100%' : '0%', background: badgeColor, borderRadius: 2, transition: 'width .4s' }} />
                </div>

                {/* QR preview + actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setShowPassModal(p)} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 0', color: '#8b9ab8', fontSize: 11, cursor: 'pointer' }}>
                    🔍 View QR
                  </button>
                  <button onClick={() => handleDownload(p._id, p.passId)} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 0', color: '#8b9ab8', fontSize: 11, cursor: 'pointer' }}>
                    📥 PDF
                  </button>
                  {p.status === 'active' && (
                    <button onClick={() => handleRevoke(p._id)} style={{ background: '#2a0d0d', border: '1px solid #ef444444', borderRadius: 8, padding: '6px 10px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ISSUE PASS MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Issue Visitor Pass</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Select Visitor *</label>
              <select value={form.visitor} onChange={e => setForm({ ...form, visitor: e.target.value })} style={inp}>
                <option value="">Choose visitor…</option>
                {visitors.filter(v => ['approved', 'pending'].includes(v.status)).map(v => (
                  <option key={v._id} value={v._id}>{v.firstName} {v.lastName} — {v.company || 'Individual'}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Valid From *</label>
                <input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Valid Until *</label>
                <input type="datetime-local" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Access Level</label>
                <select value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value })} style={inp}>
                  <option value="standard">Standard</option>
                  <option value="extended">Extended</option>
                  <option value="restricted">Restricted</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Badge Type</label>
                <select value={form.badgeType} onChange={e => setForm({ ...form, badgeType: e.target.value })} style={inp}>
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="contractor">Contractor</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Notify Visitor Via</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.notifyEmail} onChange={e => setForm({ ...form, notifyEmail: e.target.checked })} /> Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.notifySMS} onChange={e => setForm({ ...form, notifySMS: e.target.checked })} /> SMS
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 0', color: '#8b9ab8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleIssue} disabled={submitting} style={{ flex: 2, background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: submitting ? .7 : 1 }}>
                {submitting ? 'Issuing…' : '🎫 Issue Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR VIEW MODAL */}
      {showPassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPassModal(null); }}>
          <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 14, padding: 24, width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Visitor Pass QR</h2>
              <button onClick={() => setShowPassModal(null)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {showPassModal.qrCode ? (
              <img src={showPassModal.qrCode} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }} />
            ) : (
              <div style={{ width: 180, height: 180, background: '#1e2535', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 12, color: '#5a6a88' }}>QR not available</div>
            )}
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>
              {showPassModal.visitor?.firstName} {showPassModal.visitor?.lastName}
            </div>
            <div style={{ fontSize: 11, color: '#5a6a88', marginTop: 4, fontFamily: 'monospace' }}>{showPassModal.passId}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#8b9ab8' }}>
              Valid: {new Date(showPassModal.validFrom).toLocaleString()} → {new Date(showPassModal.validUntil).toLocaleString()}
            </div>
            <button onClick={() => handleDownload(showPassModal._id, showPassModal.passId)}
              style={{ marginTop: 16, width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              📥 Download PDF Badge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };
const inp = { width: '100%', background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
