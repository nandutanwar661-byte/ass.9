// NotFoundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🏢</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#4f8ef7', margin: 0 }}>404</h1>
        <p style={{ fontSize: 16, color: '#8b9ab8', margin: '8px 0 24px' }}>Page not found</p>
        <button onClick={() => navigate('/')} style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
