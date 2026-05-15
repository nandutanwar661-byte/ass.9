import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#4f8ef7', '#a855f7', '#f59e0b', '#14b8a6', '#ef4444', '#22c55e'];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportForm, setExportForm] = useState({ from: '', to: '', format: 'csv' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    reportsAPI.getDashboard().then(r => {
      setStats(r.data.stats);
      setDaily(r.data.dailyCounts || []);
      setByDept(r.data.byDepartment || []);
    }).catch(() => {
      setStats({ totalVisitors: 1248, weeklyPasses: 186, pendingApprovals: 9, checkedIn: 7 });
      setDaily([
        { _id: 'Mon', count: 28 }, { _id: 'Tue', count: 35 }, { _id: 'Wed', count: 42 },
        { _id: 'Thu', count: 30 }, { _id: 'Fri', count: 48 }, { _id: 'Sat', count: 20 }, { _id: 'Sun', count: 15 },
      ]);
      setByDept([{ _id: 'Engineering', count: 386 }, { _id: 'HR', count: 265 }, { _id: 'Finance', count: 184 }, { _id: 'Legal', count: 98 }, { _id: 'Admin', count: 75 }]);
    }).finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await reportsAPI.export({ from: exportForm.from, to: exportForm.to });
      const visitors = data.visitors || [];

      if (exportForm.format === 'csv') {
        const headers = ['Name', 'Email', 'Company', 'Host', 'Department', 'Purpose', 'Status', 'Visit Date'];
        const rows = visitors.map(v => [
          `${v.firstName} ${v.lastName}`, v.email, v.company || '',
          v.host?.name || '', v.department, v.purpose, v.status,
          new Date(v.visitDate).toLocaleDateString(),
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `visipass-report-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${visitors.length} records as CSV`);
      } else {
        // JSON export fallback
        const blob = new Blob([JSON.stringify(visitors, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `visipass-report-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${visitors.length} records`);
      }
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  if (loading) return <div style={{ color: '#5a6a88', textAlign: 'center', padding: 40 }}>Loading reports…</div>;

  const quickStats = [
    { label: 'Total Visitors', val: stats?.totalVisitors || 0, color: '#4f8ef7' },
    { label: 'This Week', val: stats?.weeklyPasses || 0, color: '#22c55e' },
    { label: 'Currently Inside', val: stats?.checkedIn || 0, color: '#f59e0b' },
    { label: 'Pending', val: stats?.pendingApprovals || 0, color: '#a855f7' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: 0 }}>Reports & Analytics</h1>
        <p style={{ fontSize: 13, color: '#5a6a88', margin: '4px 0 0' }}>System-wide visitor data and export tools</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
        {quickStats.map(s => (
          <div key={s.label} style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#8b9ab8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
        {/* Bar chart */}
        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Daily Visitor Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <XAxis dataKey="_id" tick={{ fill: '#5a6a88', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6a88', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, color: '#e8ecf4', fontSize: 12 }} cursor={{ fill: 'rgba(79,142,247,.08)' }} />
              <Bar dataKey="count" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Visitors by Department</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byDept} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export tool */}
      <div style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>📊 Export Report</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>From Date</label>
            <input type="date" value={exportForm.from} onChange={e => setExportForm({ ...exportForm, from: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>To Date</label>
            <input type="date" value={exportForm.to} onChange={e => setExportForm({ ...exportForm, to: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>Format</label>
            <select value={exportForm.format} onChange={e => setExportForm({ ...exportForm, format: e.target.value })} style={inp}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleExport} disabled={exporting}
              style={{ width: '100%', background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: exporting ? .7 : 1 }}>
              {exporting ? 'Exporting…' : '📥 Export'}
            </button>
          </div>
        </div>

        {/* Department breakdown table */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#8b9ab8', marginBottom: 10 }}>Department Breakdown</div>
          {byDept.map((d, i) => {
            const max = byDept[0]?.count || 1;
            return (
              <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#8b9ab8', width: 100, flexShrink: 0 }}>{d._id}</span>
                <div style={{ flex: 1, height: 8, background: '#2a3347', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.count / max) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, color: '#5a6a88', width: 40, textAlign: 'right' }}>{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, color: '#8b9ab8', marginBottom: 5, fontWeight: 500 };
const inp = { width: '100%', background: '#161b27', border: '1px solid #2a3347', borderRadius: 8, padding: '8px 12px', color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
