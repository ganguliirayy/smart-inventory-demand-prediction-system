import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', top:'10%', left:'10%', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(60px)', animation:'float 8s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'10%', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(60px)', animation:'float 10s ease-in-out infinite reverse' }} />

      <div style={{
        background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px',
        padding: '40px', width: '100%', maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)', position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '18px', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '36px', marginBottom: '16px',
            boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
          }}>💊</div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            RxFlow AI
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>Smart Pharmacy Intelligence</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px', padding: '12px 16px', color: '#ef4444',
            fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <h2 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '22px' }}>
            Login to access your pharmacy dashboard
          </p>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              type="email" required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '11px', color: '#e2e8f0', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px', boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '11px', color: '#e2e8f0', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '16px',
              }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '12px', color: '#fff',
            fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
          }}
          onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'; }}}
          onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)'; }}>
            {loading ? '🔄 Logging in...' : '🚀 Login to Dashboard'}
          </button>
        </form>

        {/* Signup Link */}
        <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
            Don't have an account?
          </p>
          <Link to="/signup" style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(16,185,129,0.2)'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(16,185,129,0.1)'; e.target.style.transform = 'translateY(0)'; }}>
            Create New Account →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}