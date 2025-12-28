'use client';

import { useState } from 'react';

export default function TestChatPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState('მინდა შევქმნა web საიტი რომელიც დაეხმარება მომხმარებელს შეაფსონ მათი ბიზნეს იდეა და დაგეგმონ ის');

  const testChat = async () => {
    setLoading(true);
    setResult(null);
    try {
      console.log('Sending request...');
      const response = await fetch('/api/test-chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>🧪 Test Chat Flow</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        This tests the exact same API call that the chat makes
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Business Idea (Georgian):
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '2px solid #ddd',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        onClick={testChat}
        disabled={loading || !idea}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: loading || !idea ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading || !idea ? 'not-allowed' : 'pointer',
          marginBottom: '30px',
        }}
      >
        {loading ? 'Testing...' : 'Test Chat API'}
      </button>

      {result && (
        <div>
          {/* Success/Error Banner */}
          {result.success ? (
            <div style={{
              background: '#e6ffe6',
              border: '2px solid #00aa00',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{ color: '#00aa00', marginTop: 0 }}>✅ Success!</h3>
              <p>The AI API call worked. Check the details below.</p>
            </div>
          ) : (
            <div style={{
              background: '#ffe6e6',
              border: '2px solid #ff0000',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{ color: '#cc0000', marginTop: 0 }}>❌ Error</h3>
              <p><strong>Error:</strong> {result.error}</p>
              {result.stack && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer' }}>Show Stack Trace</summary>
                  <pre style={{ fontSize: '11px', overflow: 'auto', marginTop: '10px' }}>
                    {result.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Response Summary */}
          {result.response && (
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3>Response Summary</h3>
              <div style={{ fontSize: '14px' }}>
                <div>📝 Has Text: {result.response.text ? '✅ Yes' : '❌ No'}</div>
                <div>🔧 Has Function Calls: {result.response.functionCalls ? `✅ Yes (${result.response.functionCalls.length})` : '❌ No'}</div>
                {result.response.functionCalls && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Function Calls:</strong>
                    <ul>
                      {result.response.functionCalls.map((fc: any, i: number) => (
                        <li key={i}>{fc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Response */}
          <details>
            <summary style={{ cursor: 'pointer', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
              Show Full JSON Response
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
