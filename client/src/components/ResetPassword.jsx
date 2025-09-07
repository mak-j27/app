import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword({ onClose, formId } = {}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const e = searchParams.get('email') || '';
    const t = searchParams.get('token') || '';
    setEmail(e);
    setToken(t);
  }, [searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      // detect response type
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
      if (res.ok) {
        setStatus({ success: true, message: data.message || 'Password reset', bodyType });
        // redirect to login after short delay
        setTimeout(() => navigate('/login'), 1500);
      } else {
        console.error('Password reset failed', { status: res.status, headers: Object.fromEntries(res.headers), bodyType, body: data });
        setStatus({ success: false, message: data.message || 'Error resetting password', bodyType });
      }
    } catch (err) {
      setStatus({ success: false, message: err.message });
    }
  };

  return (
    <div className="modal-content">
      <h2 className="modal-title">Reset Password</h2>
      <form id={formId || 'reset-form'} className="modal-form" onSubmit={submit}>
        <label htmlFor="reset-email">Email</label>
        <input id="reset-email" name="email" className="modal-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label htmlFor="reset-token">Token</label>
        <input id="reset-token" name="token" className="modal-input" value={token} onChange={e => setToken(e.target.value)} required />

        <label htmlFor="reset-password">New Password</label>
        <input id="reset-password" name="password" className="modal-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </form>

      {status && status.loading && <p>Processing...</p>}
  {status && status.success === true && <p style={{ color: 'green' }}>{status.message}</p>}
  {status && status.success === false && <p style={{ color: 'red' }}>{status.message}</p>}

  {/* If used inside a modal, parent provides onClose and will render footer actions that submit the form.
      When used as a standalone page (no onClose), render an internal submit button and optional close/nav. */}
  {!onClose && (
    <div className="modal-footer" style={{ textAlign: 'right', marginTop: 12 }}>
      <button type="button" onClick={() => navigate(-1)} style={{ marginRight: 8 }}>Cancel</button>
      <button type="submit" form={formId || 'reset-form'}>Reset Password</button>
    </div>
  )}

  {onClose && <div style={{ textAlign: 'right', marginTop: 8 }}><button onClick={onClose}>Close</button></div>}
    </div>
  );
}
