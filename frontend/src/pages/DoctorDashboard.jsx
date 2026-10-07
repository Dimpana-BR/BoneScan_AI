import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Stethoscope, 
  Users, 
  ArrowRight, 
  Play
} from 'lucide-react';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    today_total: 0,
    today_pending: 0,
    today_completed: 0,
    total_assigned: 0
  });
  const [todayPatients, setTodayPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayData();
    const timer = setInterval(loadTodayData, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayData = async () => {
    try {
      const [statsRes, patientsRes] = await Promise.all([
        doctorAPI.getDashboardStats(),
        doctorAPI.getTodayPatients()
      ]);
      setStats(statsRes.data);
      setTodayPatients(patientsRes.data);
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'CRITICAL':
        return { bg: '#fee2e2', text: '#991b1b', border: '#f87171' };
      case 'HIGH':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' };
      case 'MODERATE':
        return { bg: '#fef9c3', text: '#854d0e', border: '#facc15' };
      case 'LOW':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
            Doctor Clinical Overview
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
            Today's scheduled oncology consultations, pending evaluations, and active OPD queue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/doctor/workstation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '0.7rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Stethoscope size={17} /> Open Diagnostic Workstation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Today's Scheduled Consultations</span>
            <div style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.today_total}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Patients lined up for today</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Pending Review Today</span>
            <div style={{ backgroundColor: '#fff1f2', color: 'var(--rose-600)', padding: '0.5rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--rose-600)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.today_pending}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Awaiting clinical verification</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Completed Today</span>
            <div style={{ backgroundColor: '#ecfdf5', color: 'var(--emerald-600)', padding: '0.5rem', borderRadius: '8px' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--emerald-600)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.today_completed}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Signed off with directives</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Total Career Consultations</span>
            <div style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)', padding: '0.5rem', borderRadius: '8px' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.total_assigned}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Lifetime hospital case volume</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)' }}>Today's Scheduled Consultations</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>Click on any patient row to open their diagnostic scans and run AI analysis</p>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.88rem', fontWeight: 600 }}
          >
            View Full Patient Registry <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '3rem 0' }}>Loading today's schedule...</p>
        ) : todayPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--slate-400)' }}>
            <Calendar size={36} color="var(--slate-300)" style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ fontWeight: 600 }}>No appointments scheduled for today yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Newly scheduled slots from reception will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Scheduled Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient UID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Demographics</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {todayPatients.map((p) => {
                  const badge = getRiskBadge(p.risk_level);
                  return (
                    <tr 
                      key={p.patient_id} 
                      onClick={() => navigate(`/doctor/workstation?patientId=${p.patient_id}`)}
                      style={{ borderBottom: '1px solid var(--slate-100)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {p.appointment_time}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {p.patient_uid}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-500)' }}>
                        {p.age} Yrs / {p.gender}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-600)' }}>
                        {p.phone}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: p.status === 'Completed' ? 'var(--emerald-50)' : 'var(--rose-50)',
                          color: p.status === 'Completed' ? 'var(--emerald-600)' : 'var(--rose-600)',
                          border: `1px solid ${p.status === 'Completed' ? '#a7f3d0' : '#fecdd3'}`
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doctor/workstation?patientId=${p.patient_id}`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}
                        >
                          <Play size={13} /> Open Scan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}