import React, { useEffect, useState } from 'react';
import { passesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function MyPassPage() {
  const { user } = useAuth();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    passesAPI.getAll({ limit: 1 })
      .then(r => {
        const passes = r.data.passes || [];
        if (passes.length > 0) setPass(passes[0]);
      })
      .catch(() => {
        setPass(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleDownload = async () => {
    if (!pass?._id) { toast.error('Pass not available for download'); return; }
    try {
      const { data } = await passesAPI.downloadPDF(pass._id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `my-pass-${pass.passId}.pdf`; a.click();
    } catch { toast.error('Download failed'); }
  };

  const BADGE_COLORS = { standard: '#4f8ef7', vip: '#a855f7', contractor: '#f59e0b', delivery: '#22c55e' };
  const STATUS = { active: { color: '#22c55e', bg: '#0d2318', label: '✓ Active' }, expired: { color: '#5a6a88', bg: '#1a1f2e', label: 'Expired' }, revoked: { color: '#ef4444', bg: '#2a0d0d', label: 'Revoked' } };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#5a6a88' }}>Loading your pass…</div>;

  if (!pass) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#e8ecf4' }}>No pass found</div>
      <div style={{ fontSize: 13, color: '#5a6a88', marginTop: 6 }}>Your pass will appear here once issued</div>
    </div>
  );

  const badgeColor = BADGE_COLORS[pass.badgeType] || '#4f8ef7';
  const st = STATUS[pass.status] || STATUS.active;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: '0 0 20px', textAlign: 'center' }}>My Visitor Pass</h1>

      <div style={{ background: `linear-gradient(135deg, #1e2535, #1a2a4a)`, border: `1px solid ${badgeColor}55`, borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden', marginBottom: 14 }}>
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: badgeColor }} />

        {/* Status + badge type */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 18 }}>
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: st.color, background: st.bg }}>{st.label}</span>
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, color: badgeColor, background: `${badgeColor}22`, textTransform: 'uppercase', fontWeight: 600 }}>{pass.badgeType}</span>
        </div>

        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${badgeColor}22`, border: `2px solid ${badgeColor}55`, color: badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 12px' }}>
            {pass.visitor?.firstName?.[0]}{pass.visitor?.lastName?.[0]}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{pass.visitor?.firstName} {pass.visitor?.lastName}</div>
          <div style={{ fontSize: 12, color: '#8b9ab8', marginTop: 3 }}>{pass.visitor?.company}</div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Department', pass.visitor?.department],
            ['Access Level', pass.accessLevel?.toUpperCase()],
            ['Valid From', new Date(pass.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
            ['Valid Until', new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
            ['Issued By', pass.issuedBy?.name],
            ['Pass ID', pass.passId],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: '#5a6a88', textTransform: 'uppercase', letterSpacing: '.4px' }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
            </div>
          ))}
        </div>

        {/* QR code */}
        <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          {pass.qrCode ? (
            <img src={pass.qrCode} alt="QR Code" style={{ width: 140, height: 140, borderRadius: 8, background: '#fff', padding: 6 }} />
          ) : (
            <div style={{ width: 140, height: 140, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', padding: 10 }}>
              {/* SVG QR placeholder */}
              <svg viewBox="0 0 21 21" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
                <rect width="21" height="21" fill="white"/>
                <rect x="1" y="1" width="7" height="7" fill="none" stroke="black" strokeWidth=".8"/>
                <rect x="2.5" y="2.5" width="4" height="4" fill="black"/>
                <rect x="13" y="1" width="7" height="7" fill="none" stroke="black" strokeWidth=".8"/>
                <rect x="14.5" y="2.5" width="4" height="4" fill="black"/>
                <rect x="1" y="13" width="7" height="7" fill="none" stroke="black" strokeWidth=".8"/>
                <rect x="2.5" y="14.5" width="4" height="4" fill="black"/>
                <rect x="9" y="1" width="1.5" height="1.5" fill="black"/>
                <rect x="11" y="1" width="1.5" height="1.5" fill="black"/>
                <rect x="13" y="9" width="1.5" height="1.5" fill="black"/>
                <rect x="15" y="9" width="1.5" height="1.5" fill="black"/>
                <rect x="9" y="13" width="1.5" height="1.5" fill="black"/>
                <rect x="13" y="13" width="1.5" height="1.5" fill="black"/>
                <rect x="17" y="15" width="1.5" height="1.5" fill="black"/>
              </svg>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 8 }}>Show this at the entrance</div>
          <div style={{ fontSize: 10, color: '#5a6a88', marginTop: 3, fontFamily: 'monospace' }}>{pass.passId}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleDownload} style={{ flex: 1, background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 0', color: '#8b9ab8', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          📥 Download PDF
        </button>
        <button onClick={() => { if (navigator.share) { navigator.share({ title: 'My Visitor Pass', text: pass.passId }); } else { navigator.clipboard.writeText(pass.passId); toast.success('Pass ID copied!'); } }}
          style={{ flex: 1, background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 0', color: '#8b9ab8', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          📤 Share Pass
        </button>
      </div>
    </div>
  );
}
