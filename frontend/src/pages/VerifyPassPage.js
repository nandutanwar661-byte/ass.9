// VerifyPassPage.js — public QR verify landing page
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { passesAPI } from '../utils/api';

export function VerifyPassPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setResult({ valid: false, message: 'No pass token provided.' });
      setLoading(false);
      return;
    }

    passesAPI.getPublic(token)
      .then((response) => setResult(response.data))
      .catch((err) => {
        setResult({ valid: false, message: err.response?.data?.message || 'Unable to verify pass. Please contact reception.' });
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: '#161b27', border: '1px solid #2a3347', borderRadius: 16, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>
          {loading ? '⏳' : result?.valid ? '✅' : '❌'}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e8ecf4', margin: '0 0 8px' }}>
          {loading ? 'Verifying Pass…' : result?.valid ? 'Pass Verified' : 'Invalid Pass'}
        </h1>
        <p style={{ fontSize: 13, color: '#8b9ab8', margin: 0 }}>
          {loading ? 'Please wait…' : result?.message}
        </p>
        {result?.valid && (
          <div style={{ marginTop: 20, background: '#1e2535', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#5a6a88' }}>Token</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6ea8ff', marginTop: 4, wordBreak: 'break-all' }}>{token}</div>
          </div>
        )}
        <p style={{ fontSize: 11, color: '#5a6a88', marginTop: 20 }}>Powered by VisiPass</p>
      </div>
    </div>
  );
}

export default VerifyPassPage;
