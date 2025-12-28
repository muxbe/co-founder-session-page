'use client';

import { useState } from 'react';

export default function ModelsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const listModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/list-available-models');
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
      <h1 style={{ marginBottom: '20px' }}>📋 Available Gemini Models</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        This shows ALL models available for your API key
      </p>

      <button
        onClick={listModels}
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
        {loading ? 'Loading Models...' : 'List Available Models'}
      </button>

      {result && (
        <div>
          {/* Recommendation */}
          {result.recommendation && (
            <div style={{
              background: '#e6f7ff',
              border: '2px solid #1890ff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '16px',
            }}>
              <strong>✅ Recommendation:</strong>
              <div style={{ marginTop: '10px' }}>{result.recommendation}</div>
            </div>
          )}

          {/* V1 Models */}
          {result.v1 && (
            <div style={{
              background: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3>V1 API Models (Status: {result.v1.status})</h3>
              {result.v1.available && result.v1.models?.length > 0 ? (
                <div>
                  <p><strong>Found {result.v1.count} models that support generateContent:</strong></p>
                  {result.v1.models.map((model: any, i: number) => (
                    <div key={i} style={{
                      background: 'white',
                      padding: '15px',
                      marginBottom: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#0070f3', marginBottom: '5px' }}>
                        {model.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>
                        {model.displayName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#999' }}>
                        {model.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>No models available or API not accessible</p>
              )}
            </div>
          )}

          {/* V1BETA Models */}
          {result.v1beta && (
            <div style={{
              background: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3>V1BETA API Models (Status: {result.v1beta.status})</h3>
              {result.v1beta.available && result.v1beta.models?.length > 0 ? (
                <div>
                  <p><strong>Found {result.v1beta.count} models that support generateContent:</strong></p>
                  {result.v1beta.models.map((model: any, i: number) => (
                    <div key={i} style={{
                      background: 'white',
                      padding: '15px',
                      marginBottom: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#0070f3', marginBottom: '5px' }}>
                        {model.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>
                        {model.displayName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#999' }}>
                        {model.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999' }}>No models available or API not accessible</p>
              )}
            </div>
          )}

          {/* Raw JSON */}
          <details style={{ marginTop: '30px' }}>
            <summary style={{ cursor: 'pointer', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
              Show Raw JSON Response
            </summary>
            <div style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '20px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '600px',
              marginTop: '10px',
            }}>
              <pre style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
