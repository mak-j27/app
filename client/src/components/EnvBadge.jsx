import React from 'react';

export default function EnvBadge() {
  const mode = (import.meta.env && import.meta.env.MODE) || 'development';
  const isDev = mode === 'development' || mode === 'dev';

  return <div className="env-badge" style={{ background: isDev ? '#f97316' : '#16a34a', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>{isDev ? 'DEV' : 'PROD'}</div>;
}
