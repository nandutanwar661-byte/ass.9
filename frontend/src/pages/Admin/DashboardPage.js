import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, visitorsAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const S = { // inline style helpers
  card: { background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 18 },
  stat: { background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 16 },
  tag: (color, bg) => ({ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color, background: bg }),
};

const STATUS_MAP = {
  checked_in: { label: 'Inside', color: '#22c55e', bg: '#0d2318' },
  checked_out: { label: 'Checked Out', color: '#4f8ef7', bg: '#1a2a4a' },
  pending: { label: 'Pending', color: '#f59e0b', bg: '#2a1d0a' },
  approved: { label: 'Approved', color: '#14b8a6', bg: '#0a1f1e' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#2a0d0d' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      reportsAPI.getDashboard(),
      visitorsAPI.getAll({ limit: 5 }),
    ]).then(([dash, vis]) => {
      setStats(dash.data.stats);
      setDailyCounts(dash.data.dailyCounts || []);
      setByDept(dash.data.byDepartment || []);
      setRecent(vis.data.visitors || []);
    }).catch(() => {
      // Fallback demo data
      setStats({ activeToday: 24, checkedIn: 7, pendingApprovals: 9, weeklyPasses: 186, totalVisitors: 1248 });
      setDailyCounts([
        { _id: 'Mon', count: 28 }, { _id: 'Tue', count: 35 }, { _id: 'Wed', count: 42 },
        { _id: 'Thu', count: 30 }, { _id: 'Fri', count: 48 }, { _id: 'Sat', count: 20 }, { _id: 'Sun', count: 15 },
      ]);
      setByDept([{ _id: 'Engineering', count: 36 }, { _id: 'HR', count: 22 }, { _id: 'Finance', count: 15 }, { _id: 'Legal', count: 10 }]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#8b9ab8', padding: 40, textAlign: 'center' }}>Loading dashboard…</div>;

  const statCards = [
    { label: 'Active Visitors Today', val: stats?.activeToday ?? 0, icon: '👥', color: '#4f8ef7', bg: '#1a2a4a', trend: '↑ 6 from yesterday', trendColor: '#22c55e' },
    { label: 'Currently Inside', val: stats?.checkedIn ?? 0, icon: '✅', color: '#22c55e', bg: '#0d2318', trend: 'Real-time', trendColor: '#8b9ab8' },
    { label: 'Pending Approvals', val: stats?.pendingApprovals ?? 0, icon: '⏳', color: '#f59e0b', bg: '#2a1d0a', trend: 'Needs action', trendColor: '#f59e0b', action: () => navigate('/visitors?status=pending') },
    { label: 'Passes This Week', val: stats?.weeklyPasses ?? 0, icon: '🎫', color: '#a855f7', bg: '#1e1030', trend: '↑ 12% vs last week', trendColor: '#22c55e' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#e8ecf4' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#5a6a88', margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ ...S.stat, cursor: s.action ? 'pointer' : 'default' }} onClick={s.action}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.trendColor, marginTop: 6 }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Weekly chart */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Visitors This Week</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyCounts}>
              <XAxis dataKey="_id" tick={{ fill: '#5a6a88', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6a88', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, color: '#e8ecf4', fontSize: 12 }} cursor={{ fill: 'rgba(79,142,247,.08)' }} />
              <Bar dataKey="count" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By department */}
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>By Department</div>
          {byDept.slice(0, 5).map((d, i) => {
            const colors = ['#4f8ef7', '#a855f7', '#f59e0b', '#14b8a6', '#ef4444'];
            const max = byDept[0]?.count || 1;
            return (
              <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#8b9ab8', width: 90, flexShrink: 0 }}>{d._id}</span>
                <div style={{ flex: 1, height: 6, background: '#2a3347', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.count / max) * 100}%`, background: colors[i % colors.length], borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: '#5a6a88', width: 24, textAlign: 'right' }}>{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent visitors table */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Recent Visitors</div>
          <button onClick={() => navigate('/visitors')} style={{ background: 'transparent', border: '1px solid #2a3347', borderRadius: 8, padding: '5px 12px', color: '#8b9ab8', fontSize: 11, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Visitor', 'Company', 'Host', 'Purpose', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#5a6a88', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #2a3347' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#5a6a88' }}>No recent visitors</td></tr>
              ) : recent.map((v) => {
                const st = STATUS_MAP[v.status] || STATUS_MAP.pending;
                return (
                  <tr key={v._id} style={{ borderBottom: '1px solid rgba(42,51,71,.4)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1a2a4a', color: '#6ea8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                          {`${v.firstName?.[0]}${v.lastName?.[0]}`}
                        </div>
                        {v.firstName} {v.lastName}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{v.company || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8' }}>{v.host?.name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#8b9ab8', textTransform: 'capitalize' }}>{v.purpose?.replace('_', ' ') || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={S.tag(st.color, st.bg)}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
