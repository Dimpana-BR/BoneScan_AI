import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistAPI } from '../services/api';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  Search, 
  ArrowRight, 
  Activity,
  AlertCircle
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_patients: 0,
    today_appointments: 0,
    pending_reviews: 0,
    completed_reviews: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, patientsRes] = await Promise.all([
        receptionistAPI.getDashboardStats(),
        receptionistAPI.getAllPatients()
      ]);
      setStats(statsRes.data);
      setRecentPatients(patientsRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch receptionist metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
            Receptionist Command Center
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
            Overview of clinical intake volume, scheduled appointments, and pending oncology reviews.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/receptionist/register')}
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
            <UserPlus size={17} /> Register New Patient
          </button>
          <button
            onClick={() => navigate('/receptionist/appointments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              color: 'var(--slate-800)',
              border: '1px solid var(--slate-300)',
              padding: '0.7rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <Calendar size={17} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Total Registered</span>
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.total_patients}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Cumulative hospital intake</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Today's Consultations</span>
            <div style={{ backgroundColor: '#fef3c7', color: 'var(--amber-600)', padding: '0.5rem', borderRadius: '8px' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.today_appointments}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Scheduled for today's OPD</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Pending AI Review</span>
            <div style={{ backgroundColor: 'var(--rose-50)', color: 'var(--rose-600)', padding: '0.5rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.pending_reviews}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Awaiting oncologist verdict</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-500)' }}>Completed Reviews</span>
            <div style={{ backgroundColor: 'var(--emerald-50)', color: 'var(--emerald-600)', padding: '0.5rem', borderRadius: '8px' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
            {loading ? '...' : stats.completed_reviews}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>Signed off by oncology</div>
        </div>
      </div>

      {/* Recent Admissions Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>Recent Patient Admissions</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>Last 5 entries registered at reception</p>
          </div>
          <button
            onClick={() => navigate('/receptionist/search')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            View All Records <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--slate-400)', padding: '2rem 0', textAlign: 'center' }}>Loading live records...</p>
        ) : recentPatients.length === 0 ? (
          <p style={{ color: 'var(--slate-400)', padding: '2rem 0', textAlign: 'center' }}>No patients registered yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient UID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Demographics</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Doctor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Appointment</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{p.patient_uid}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--slate-800)' }}>{p.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-500)' }}>{p.age} Yrs / {p.gender} ({p.blood_group})</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-700)' }}>{p.assigned_doctor}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-600)' }}>{p.appointment_date}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.2rem 0.6rem',
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}