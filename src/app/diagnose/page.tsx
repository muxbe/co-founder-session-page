'use client';

import { useState } from 'react';

export default function DiagnosePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diagnose');
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
      <h1 style={{ marginBottom: '20px' }}>🔬 Deep API Diagnosis</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        This tool makes direct HTTP requests to Google's API to find the root cause
      </p>

      <button
        onClick={runDiagnosis}
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
        {loading ? 'Running Diagnosis...' : 'Run Full Diagnosis'}
      </button>

      {result && (
        <div>
          {/* Diagnosis */}
          {result.diagnosis && (
            <div style={{
              background: '#fffbe6',
              border: '2px solid #faad14',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}>
              <div>🔍 Diagnosis: {result.diagnosis}</div>
            </div>
          )}

          {/* Quick Summary */}
          <div style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h3>Quick Summary</h3>
            <div style={{ fontSize: '16px' }}>
              <div>✓ Environment Check: {result.results?.step1_env?.keyExists ? '✅' : '❌'}</div>
              <div>✓ SDK Version: {result.results?.step2_sdk_version?.geminiVersion || 'Unknown'}</div>
              <div>✓ V1 API: {result.results?.step3_direct_v1?.ok ? '✅' : '❌'} (Status: {result.results?.step3_direct_v1?.status || 'N/A'})</div>
              <div>✓ V1BETA API: {result.results?.step4_direct_v1beta?.ok ? '✅' : '❌'} (Status: {result.results?.step4_direct_v1beta?.status || 'N/A'})</div>
            </div>
          </div>

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

          {/* Instructions */}
          {result.results?.step3_direct_v1?.status === 403 && (
            <div style={{
              background: '#ffe6e6',
              border: '2px solid #ff0000',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0 }}>⚠️ API Key Permission Issue</h3>
              <p>Your API key exists but doesn't have permission to use Gemini API.</p>
              <h4>Fix:</h4>
              <ol>
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a></li>
                <li>Make sure you created the API key there (not Google Cloud)</li>
                <li>Check if the key has access enabled</li>
                <li>Try creating a new API key</li>
              </ol>
            </div>
          )}

          {result.results?.step3_direct_v1?.status === 404 && result.results?.step4_direct_v1beta?.status === 404 && (
            <div style={{
              background: '#ffe6e6',
              border: '2px solid #ff0000',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0 }}>❌ Model Not Found</h3>
              <p>The model doesn't exist in either v1 or v1beta APIs.</p>
              <h4>Possible Causes:</h4>
              <ol>
                <li><strong>Wrong API Key Source:</strong> You might have a Google Cloud API key instead of Google AI Studio key</li>
                <li><strong>Region Restriction:</strong> Your API key might be region-locked</li>
                <li><strong>Service Not Enabled:</strong> Gemini API not enabled for this key</li>
              </ol>
              <h4>Fix:</h4>
              <ol>
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a></li>
                <li>Create a NEW API key</li>
                <li>Copy the new key</li>
                <li>Replace GEMINI_API_KEY in your .env.local file</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
