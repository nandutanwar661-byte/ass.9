import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    orgName: 'Acme Corporation', passDuration: 8, maxDailyVisitors: 200,
    notifEmail: 'security@acme.com', badgeColor: '#4f8ef7',
    emailOnArrival: true, smsForVIP: true, dailyDigest: false,
    securityAlerts: true, overstayWarnings: true,
  });

  const handle = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const save = () => toast.success('Settings saved!');

  const colors = ['#4f8ef7', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6'];
  const zones = [
    { name: 'Lobby', status: 'open' }, { name: 'Meeting Rooms', status: 'open' },
    { name: 'Server Room', status: 'restricted' }, { name: 'Executive Floor', status: 'escorted' },
  ];
  const zoneColors = { open: { color: '#22c55e', bg: '#0d2318' }, restricted: { color: '#ef4444', bg: '#2a0d0d' }, escorted: { color: '#f59e0b', bg: '#2a1d0a' } };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: '0 0 16px' }}>System Settings</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>General</div>
          {[['Organization Name', 'orgName', 'text'], ['Notification Email', 'notifEmail', 'email']].map(([label, key, type]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={lbl}>{label}</label>
              <input type={type} value={settings[key]} onChange={e => handle(key, e.target.value)} style={inp} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Default Pass Duration (hrs)</label><input type="number" value={settings.passDuration} onChange={e => handle('passDuration', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Max Daily Visitors</label><input type="number" value={settings.maxDailyVisitors} onChange={e => handle('maxDailyVisitors', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Badge Color Theme</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {colors.map(c => (
                <div key={c} onClick={() => handle('badgeColor', c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: settings.badgeColor === c ? '2px solid #fff' : '2px solid transparent', transition: 'border .15s' }} />
              ))}
            </div>
          </div>
          <button onClick={save} style={{ width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Save Settings
          </button>
        </div>

        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Notifications</div>
          {[
            ['emailOnArrival', 'Email on visitor arrival'],
            ['smsForVIP', 'SMS alerts for VIP visitors'],
            ['dailyDigest', 'Daily digest reports'],
            ['securityAlerts', 'Security alerts'],
            ['overstayWarnings', 'Overstay warnings'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid #2a3347', fontSize: 13 }}>
              <span>{label}</span>
              <div onClick={() => handle(key, !settings[key])} style={{ width: 40, height: 22, borderRadius: 11, background: settings[key] ? '#4f8ef7' : '#2a3347', position: 'relative', transition: 'background .2s', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 3, left: settings[key] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </div>
            </label>
          ))}

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Access Zones</div>
            {zones.map(z => {
              const s = zoneColors[z.status];
              return (
                <div key={z.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2a3347' }}>
                  <span style={{ fontSize: 12 }}>{z.name}</span>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: s.color, background: s.bg, textTransform: 'capitalize' }}>{z.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };
const inp = { width: '100%', background: '#161b27', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
