'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>🔍 API Debugging Tool</h1>

      <button
        onClick={runDebug}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '30px',
        }}
      >
        {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
      </button>

      {result && (
        <div>
          <h2>Test Results:</h2>

          {/* Summary */}
          {result.summary && (
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3>Summary</h3>
              <div style={{ fontSize: '24px' }}>
                <div>1️⃣ Environment Check: {result.summary.envCheck}</div>
                <div>2️⃣ API Initialization: {result.summary.apiInit}</div>
                <div>3️⃣ Simple Call: {result.summary.simpleCall}</div>
                <div>4️⃣ Tools Call: {result.summary.toolsCall}</div>
              </div>
            </div>
          )}

          {/* Detailed Results */}
          <div style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '600px',
          }}>
            <pre style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div style={{
              background: '#ffe6e6',
              border: '2px solid #ff0000',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0 }}>❌ Errors Found:</h3>
              {result.errors.map((error: any, index: number) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <strong>Step: {error.step}</strong>
                  <div>{error.error}</div>
                </div>
              ))}
            </div>
          )}

          {/* Success */}
          {result.success && (
            <div style={{
              background: '#e6ffe6',
              border: '2px solid #00aa00',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
            }}>
              <h3 style={{ color: '#00aa00', marginTop: 0 }}>✅ All Tests Passed!</h3>
              <p>Your Gemini API is configured correctly and working.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
