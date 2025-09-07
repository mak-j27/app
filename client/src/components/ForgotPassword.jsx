import React, { useState } from 'react';
import { Box, Container } from '@mui/material';

export default function ForgotPassword({ onClose, formId } = {}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      // Detect response body type
      let data;
      let bodyType = 'empty';
      try {
        data = await res.clone().json();
        bodyType = 'json';
      } catch {
        try {
          const text = await res.clone().text();
          if (text && text.length) {
            bodyType = 'text';
            data = { message: text };
          } else {
            data = { message: '' };
          }
        } catch {
          data = { message: '' };
        }
      }

      if (!res.ok) {
        console.error('Password forgot failed', { status: res.status, headers: Object.fromEntries(res.headers), bodyType, body: data });
        setStatus({ success: false, message: data.message || `Error (${res.status})`, bodyType });
      } else {
        setStatus({ success: true, message: data.message || 'Check console/email for token', token: data.token, bodyType });
      }
    } catch (err) {
      console.error('Password forgot error', err);
      setStatus({ success: false, message: err.message });
    }
  };

  return (
    <Box className="full-width-page" sx={{ width: '100%' }}>
      <Container maxWidth="lg">
        <div className="modal-content" style={{ maxWidth: '100%' }}>
          <h2 className="modal-title">Forgot Password</h2>
          <form id={formId || 'forgot-form'} className="modal-form" onSubmit={submit}>
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" name="email" className="modal-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </form>

          {status && status.loading && <p>Sending...</p>}
          {status && status.success === true && (
            <div>
              <p style={{ color: 'green' }}>{status.message}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Response body type: {status.bodyType || 'unknown'}</p>
              {/* For development convenience show token when returned by server */}
              {status.token && (
                <div>
                  <p><strong>Dev token:</strong> {status.token}</p>
                  <p>Use <code>/reset-password?email={encodeURIComponent(email)}&token={status.token}</code> to reset (dev only)</p>
                </div>
              )}
            </div>
          )}
          {status && status.success === false && <p style={{ color: 'red' }}>{status.message}</p>}

          {/* Standalone submit/footer when not used as a modal */}
          {!onClose && (
            <div className="modal-footer" style={{ textAlign: 'right', marginTop: 12 }}>
              <button type="submit" form={formId || 'forgot-form'}>Send reset email</button>
            </div>
          )}

          {onClose && <div style={{ textAlign: 'right', marginTop: 8 }}><button onClick={onClose}>Close</button></div>}
        </div>
      </Container>
    </Box>
  );
}
