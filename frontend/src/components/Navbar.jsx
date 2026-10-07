import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  LogOut, 
  LayoutDashboard, 
  UserPlus, 
  Calendar, 
  Search, 
  Stethoscope 
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  const userName = localStorage.getItem('name') || sessionStorage.getItem('name');

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--slate-200)',
      boxShadow: 'var(--shadow-xs)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <div 
          onClick={() => navigate('/')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.55rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 0 1px var(--primary-subtle)'
          }}>
            <Activity size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>BoneScan</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginLeft: '4px' }}>AI</span>
            <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clinical Oncology Suite
            </span>
          </div>
        </div>

        {/* Receptionist Portal Tabs */}
        {token && role === 'receptionist' && (
          <nav style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--slate-100)', padding: '0.3rem', borderRadius: '10px' }}>
            <button
              onClick={() => navigate('/receptionist')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/receptionist') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/receptionist') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/receptionist') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => navigate('/receptionist/register')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/receptionist/register') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/receptionist/register') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/receptionist/register') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <UserPlus size={16} /> Register Patient
            </button>
            <button
              onClick={() => navigate('/receptionist/appointments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/receptionist/appointments') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/receptionist/appointments') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/receptionist/appointments') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Calendar size={16} /> Appointments
            </button>
            <button
              onClick={() => navigate('/receptionist/search')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/receptionist/search') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/receptionist/search') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/receptionist/search') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Search size={16} /> Patient Records
            </button>
          </nav>
        )}

        {/* Doctor Portal Tabs */}
        {token && role === 'doctor' && (
          <nav style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--slate-100)', padding: '0.3rem', borderRadius: '10px' }}>
            <button
              onClick={() => navigate('/doctor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/doctor') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/doctor') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/doctor') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <LayoutDashboard size={16} /> Today's Overview
            </button>
            <button
              onClick={() => navigate('/doctor/workstation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/doctor/workstation') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/doctor/workstation') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/doctor/workstation') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Stethoscope size={16} /> Diagnostic Workstation
            </button>
            <button
              onClick={() => navigate('/doctor/patients')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive('/doctor/patients') ? 'var(--primary)' : 'var(--slate-600)',
                backgroundColor: isActive('/doctor/patients') ? '#ffffff' : 'transparent',
                boxShadow: isActive('/doctor/patients') ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Search size={16} /> All Patients Directory
            </button>
          </nav>
        )}

        {/* User Session Profile & Exit */}
        {token ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--slate-100)',
                color: 'var(--slate-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--slate-200)',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {userName ? userName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate-800)', lineHeight: 1.2 }}>{userName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>{role}</div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--rose-600)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--rose-500)',
                backgroundColor: 'var(--rose-50)'
              }}
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Hospital Medical Intranet
          </div>
        )}
      </div>
    </header>
  );
}