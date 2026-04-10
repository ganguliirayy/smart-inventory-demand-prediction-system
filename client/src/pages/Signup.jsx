import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signup(formData.name, formData.email, formData.password, formData.phone);
    
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 11s ease-in-out infinite reverse',
      }} />

      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '16px',
            boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
          }}>
            ✨
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px',
            letterSpacing: '-0.5px',
          }}>
            Create Account
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
            Join RxFlow AI - Smart Pharmacy Management
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ef4444',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '12px 16px',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '11px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '11px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Phone (Optional) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              Phone Number <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="98XXXXXXXX"
              style={{
                width: '100%',
                padding: '12px 16px',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '11px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 16px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '11px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '16px',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfPass ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 16px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '11px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfPass(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '16px',
                }}
              >
                {showConfPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.4)',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 30px rgba(16,185,129,0.5)';
              }
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(16,185,129,0.4)';
            }}
          >
            {loading ? '🔄 Creating Account...' : '✨ Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
            Already have an account?
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '10px',
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(99,102,241,0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(99,102,241,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Login to Your Account →
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