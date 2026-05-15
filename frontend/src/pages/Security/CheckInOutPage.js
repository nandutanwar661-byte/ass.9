import React, { useEffect, useState, useCallback, useRef } from 'react';
import { passesAPI, checkLogsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function CheckInOutPage() {
  const [logs, setLogs] = useState([]);
  const [active, setActive] = useState([]);
  const [activeTokens, setActiveTokens] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [gate, setGate] = useState('Main Entrance');
  const [loading, setLoading] = useState(true);
  const scanLineRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, activeRes, passesRes] = await Promise.all([
        checkLogsAPI.getAll({ limit: 30 }),
        checkLogsAPI.getActive(),
        passesAPI.getAll({ status: 'active', limit: 50 }),
      ]);
      setLogs(logsRes.data.logs || []);
      setActive(activeRes.data.visitors || []);
      setActiveTokens((passesRes.data.passes || []).map((pass) => pass.qrToken).filter(Boolean));
    } catch {
      // Fallback demo data
      setLogs([
        { _id: '1', type: 'check_in', visitor: { firstName: 'Jane', lastName: 'Doe', company: 'Acme Ltd' }, pass: { passId: 'VIS-2026-0847' }, timestamp: new Date(), gate: 'Main Entrance', processedBy: { name: 'Sam Porter' } },
        { _id: '2', type: 'check_out', visitor: { firstName: 'David', lastName: 'Lee', company: 'Freelance' }, pass: { passId: 'VIS-2026-0844' }, timestamp: new Date(Date.now() - 30 * 60000), gate: 'Delivery Bay', processedBy: { name: 'Sam Porter' } },
        { _id: '3', type: 'check_in', visitor: { firstName: 'John', lastName: 'Smith', company: 'Global Corp' }, pass: { passId: 'VIS-2026-0842' }, timestamp: new Date(Date.now() - 90 * 60000), gate: 'Main Entrance', processedBy: { name: 'Sam Porter' } },
      ]);
      setActive([
        { _id: '1', firstName: 'Jane', lastName: 'Doe', company: 'Acme Ltd', department: 'Engineering', host: { name: 'Emma Walsh' } },
        { _id: '2', firstName: 'John', lastName: 'Smith', company: 'Global Corp', department: 'HR', host: { name: 'Anna Lee' } },
        { _id: '3', firstName: 'Maria', lastName: 'Garcia', company: 'Tech Partners', department: 'Finance', host: { name: 'Robert Kim' } },
      ]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (token) => {
    if (!token.trim()) return toast.error('Enter a QR token or scan a code');
    setScanning(true);
    setScanResult(null);
    try {
      const { data } = await passesAPI.verify(token.trim(), gate);
      setScanResult({ success: true, ...data });
      toast.success(data.message);
      setManualToken('');
      setTimeout(load, 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setScanResult({ success: false, message: msg });
      toast.error(msg);
    } finally { setScanning(false); }
  };

  // Simulate QR scan with a live active pass token from backend
  const simulateScan = () => {
    if (!activeTokens.length) {
      return toast.error('No active pass tokens available for simulation.');
    }
    const token = activeTokens[Math.floor(Math.random() * activeTokens.length)];
    handleVerify(token);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>Check In / Out</h1>
        <p style={{ fontSize: 13, color: '#5a6a88', margin: '4px 0 0' }}>Scan QR codes to process visitor entries and exits</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Scanner panel */}
        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>QR Code Scanner</div>

          {/* Animated scan box */}
          <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 16px', border: '2px solid #4f8ef7', borderRadius: 12, overflow: 'hidden', background: '#0f1117' }}>
            {/* Corner markers */}
            {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
              <div key={`${v}${h}`} style={{ position: 'absolute', [v]: 8, [h]: 8, width: 16, height: 16,
                borderTop: v === 'top' ? '2px solid #6ea8ff' : 'none', borderBottom: v === 'bottom' ? '2px solid #6ea8ff' : 'none',
                borderLeft: h === 'left' ? '2px solid #6ea8ff' : 'none', borderRight: h === 'right' ? '2px solid #6ea8ff' : 'none',
                borderRadius: v === 'top' && h === 'left' ? '2px 0 0 0' : v === 'top' && h === 'right' ? '0 2px 0 0' : v === 'bottom' && h === 'left' ? '0 0 0 2px' : '0 0 2px 0',
              }} />
            ))}
            {/* Scan line animation */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #4f8ef7, transparent)', animation: 'scanline 2s ease-in-out infinite alternate', top: 10 }} ref={scanLineRef} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: .15 }}>📷</div>
            {scanning && <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,142,247,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6ea8ff' }}>Verifying…</div>}
          </div>

          <style>{`@keyframes scanline { 0% { top: 10px } 100% { top: calc(100% - 12px) } }`}</style>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5 }}>Gate / Entry Point</label>
            <select value={gate} onChange={e => setGate(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
              {['Main Entrance', 'Side Entrance', 'Delivery Bay', 'Exit Gate', 'Parking'].map(g => <option key={g}>{g}</option>)}
            </select>
            <input value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="Enter QR token manually…" style={{ ...inp, marginBottom: 8 }} onKeyDown={e => e.key === 'Enter' && handleVerify(manualToken)} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={simulateScan} disabled={scanning} style={{ flex: 1, background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: scanning ? .7 : 1 }}>
              {scanning ? '…' : '📷 Simulate Scan'}
            </button>
            <button onClick={() => handleVerify(manualToken)} disabled={!manualToken || scanning} style={{ flex: 1, background: 'transparent', border: '1px solid #2a3347', borderRadius: 8, padding: '9px 0', fontSize: 13, color: '#8b9ab8', cursor: 'pointer' }}>
              ⌨ Manual
            </button>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div style={{ marginTop: 14, padding: 14, background: scanResult.success ? '#0d2318' : '#2a0d0d', border: `1px solid ${scanResult.success ? '#22c55e' : '#ef4444'}`, borderRadius: 10, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: scanResult.success ? '#22c55e' : '#ef4444', marginBottom: 6 }}>
                {scanResult.success ? (scanResult.action === 'check_in' ? '✅ Checked In' : '👋 Checked Out') : '❌ ' + scanResult.message}
              </div>
              {scanResult.success && scanResult.pass && (
                <>
                  <div style={{ fontSize: 12, color: '#e8ecf4', fontWeight: 600 }}>{scanResult.pass.visitor?.firstName} {scanResult.pass.visitor?.lastName}</div>
                  <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 2 }}>{scanResult.pass.visitor?.company}</div>
                  <div style={{ fontSize: 11, color: '#5a6a88', marginTop: 2 }}>Host: {scanResult.pass.visitor?.host?.name}</div>
                  <div style={{ fontSize: 11, color: '#5a6a88' }}>Pass: {scanResult.pass.passId}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Currently inside */}
        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Currently Inside</div>
            <span style={{ background: '#0d2318', border: '1px solid #22c55e44', borderRadius: 6, padding: '2px 10px', fontSize: 12, color: '#22c55e', fontWeight: 700 }}>{active.length}</span>
          </div>
          {active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#5a6a88', fontSize: 12 }}>No visitors currently inside</div>
          ) : active.map(v => (
            <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #2a3347' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0d2318', border: '1px solid #22c55e44', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {v.firstName?.[0]}{v.lastName?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{v.firstName} {v.lastName}</div>
                <div style={{ fontSize: 11, color: '#8b9ab8' }}>{v.company} · {v.department}</div>
                <div style={{ fontSize: 10, color: '#5a6a88' }}>Host: {v.host?.name || '—'}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Check log */}
      <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Check-In / Out Log</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#5a6a88', fontSize: 12 }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Direction', 'Visitor', 'Pass ID', 'Gate', 'Time', 'Processed By'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#5a6a88', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #2a3347', whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#5a6a88' }}>No logs</td></tr>
                ) : logs.map(l => (
                  <tr key={l._id} style={{ borderBottom: '1px solid rgba(42,51,71,.4)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: l.type === 'check_in' ? '#0d2318' : '#1a2a4a', border: `1px solid ${l.type === 'check_in' ? '#22c55e44' : '#4f8ef744'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                          {l.type === 'check_in' ? '→' : '←'}
                        </div>
                        <span style={{ color: l.type === 'check_in' ? '#22c55e' : '#4f8ef7', fontWeight: 600 }}>
                          {l.type === 'check_in' ? 'In' : 'Out'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{l.visitor?.firstName} {l.visitor?.lastName}</div>
                      <div style={{ fontSize: 10, color: '#5a6a88' }}>{l.visitor?.company}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8', fontFamily: 'monospace', fontSize: 11 }}>{l.pass?.passId || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{l.gate || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8', whiteSpace: 'nowrap' }}>
                      {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{l.processedBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = { width: '100%', background: '#161b27', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
