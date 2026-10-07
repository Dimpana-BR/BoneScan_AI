import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Stethoscope, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2.5rem 1.5rem 1.5rem 1.5rem'
    }}>
      {/* Hero Section */}
      <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          backgroundColor: '#eff6ff',
          color: 'var(--primary)',
          padding: '0.35rem 0.95rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '1.25rem',
          border: '1px solid #bfdbfe'
        }}>
          <Sparkles size={14} /> AI-Powered Clinical Bone Oncology Suite
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          color: '#0f172a',
          letterSpacing: '-0.035em',
          lineHeight: 1.15
        }}>
          BoneScan <span style={{ color: 'var(--primary)' }}>AI</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: '#475569',
          marginTop: '0.75rem',
          fontWeight: 500,
          maxWidth: '600px',
          margin: '0.75rem auto 0 auto'
        }}>
          Dual-input osteosarcoma detection combining deep skeletal radiograph localization with serum biomarker profiling.
        </p>
      </div>

      {/* Main Department Access Cards */}
      <div style={{
        maxWidth: '960px',
        margin: '2.5rem auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {/* Receptionist Portal Card */}
        <div 
          onClick={() => navigate('/login?role=receptionist')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#eff6ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              border: '1px solid #dbeafe'
            }}>
              <UserCheck size={28} />
            </div>

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Reception Desk
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              Patient Intake
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Register new admissions, record serological biomarkers, upload skeletal X-rays, and schedule doctor consultations.
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            <span>Enter Reception Portal</span>
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Doctor Workstation Card */}
        <div 
          onClick={() => navigate('/login?role=doctor')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = '#059669';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(5, 150, 105, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.04)';
          }}
        >
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              border: '1px solid #a7f3d0'
            }}>
              <Stethoscope size={28} />
            </div>

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clinical Console
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              Doctor Workstation
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Review patient scans, trigger Grad-CAM tumor explainability overlays, finalize clinical notes, and compile PDF reports.
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#059669',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            <span>Access Workstation</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>

      {/* Clean Bottom Trust Bar */}
      <div style={{
        maxWidth: '860px',
        margin: '0 auto 1rem auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        color: '#64748b',
        fontSize: '0.82rem',
        fontWeight: 600,
        paddingTop: '1.5rem',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Activity size={16} color="var(--primary)" />
          <span>ResNet-50 + Grad-CAM Heatmap</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={16} color="#059669" />
          <span>Random Forest Biomarker Fusion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>PostgreSQL Active Sync</span>
        </div>
      </div>
    </div>
  );
}