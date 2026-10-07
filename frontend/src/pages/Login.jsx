import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Mail, AlertCircle, Stethoscope, UserCheck, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'receptionist'; // 'doctor' or 'receptionist'
  const isDoctor = roleParam === 'doctor';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem(`saved_email_${roleParam}`);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
      if (isDoctor) {
        setEmail('doctor@bonescan.com');
        setPassword('doctor123');
      } else {
        setEmail('receptionist@bonescan.com');
        setPassword('receptionist123');
      }
    }
  }, [roleParam, isDoctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email.trim(), password);
      const { access_token, role, name, user_id } = response.data;

      // Cross-role verification
      if (isDoctor && role !== 'doctor') {
        setError(`Access Denied: This account is registered as ${role}. Please sign in via the Receptionist Portal.`);
        setLoading(false);
        return;
      }
      if (!isDoctor && role !== 'receptionist') {
        setError(`Access Denied: This account is registered as ${role}. Please sign in via the Doctor Workstation.`);
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem(`saved_email_${roleParam}`, email.trim());
      } else {
        localStorage.removeItem(`saved_email_${roleParam}`);
      }

      // Save to BOTH localStorage and sessionStorage so route guards never bounce
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      if (user_id) localStorage.setItem('user_id', user_id);

      sessionStorage.setItem('token', access_token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('name', name);
      if (user_id) sessionStorage.setItem('user_id', user_id);

      if (role === 'doctor') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/receptionist', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--slate-200)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--slate-500)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            padding: '0.2rem 0'
          }}
        >
          <ArrowLeft size={16} /> Back to Portal Selection
        </button>

        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: isDoctor ? '#eff6ff' : '#ecfdf5',
            color: isDoctor ? 'var(--primary)' : 'var(--emerald-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: `inset 0 0 0 1px ${isDoctor ? 'var(--primary-subtle)' : '#a7f3d0'}`
          }}>
            {isDoctor ? <Stethoscope size={28} /> : <UserCheck size={28} />}
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
            {isDoctor ? 'Doctor Workstation' : 'Receptionist Intake Portal'}
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Authorized Clinical Staff Access
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            backgroundColor: 'var(--rose-50)',
            color: 'var(--rose-600)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            lineHeight: 1.4,
            marginBottom: '1.5rem',
            border: '1px solid #fecdd3'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.45rem' }}>
              Hospital Staff Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input
                type="email"
                required
                placeholder="staff@bonescan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                  border: '1px solid var(--slate-300)',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: 'var(--slate-900)',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.45rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 2.5rem 0.7rem 2.4rem',
                  border: '1px solid var(--slate-300)',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: 'var(--slate-900)',
                  transition: 'all 0.15s ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--slate-400)',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Password Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate-600)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              Remember my staff email
            </label>
            <span 
              onClick={() => alert('For credentials reset, please contact the hospital IT administrator.')}
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: isDoctor ? 'var(--primary)' : 'var(--emerald-600)',
              color: '#ffffff',
              padding: '0.8rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginTop: '0.5rem',
              boxShadow: isDoctor ? '0 4px 10px rgba(37, 99, 235, 0.25)' : '0 4px 10px rgba(5, 150, 105, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating Staff...' : `Access ${isDoctor ? 'Doctor Workstation' : 'Receptionist Desk'}`}
          </button>
        </form>

        {/* Security Stamp */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          color: 'var(--slate-400)',
          fontSize: '0.75rem',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--slate-100)'
        }}>
          <ShieldCheck size={14} /> End-to-end encrypted hospital intranet protocol
        </div>
      </div>
    </div>
  );
}