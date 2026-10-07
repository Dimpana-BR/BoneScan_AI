import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistAPI } from '../services/api';
import { Search, Filter, ArrowRight } from 'lucide-react';

export default function DoctorPatientDirectory() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const res = await receptionistAPI.getAllPatients();
      setPatients(res.data);
      setFilteredPatients(res.data);
    } catch (err) {
      console.error('Failed to load doctor directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = patients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.patient_uid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.assigned_doctor.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (riskFilter !== 'ALL') {
      result = result.filter((p) => p.risk_level === riskFilter);
    }
    setFilteredPatients(result);
  }, [searchQuery, statusFilter, riskFilter, patients]);

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Master Patient Directory & Clinical History
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
          Search hospital records, filter by malignancy risk level, and review diagnostic dossiers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid var(--slate-200)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            placeholder="Search by Patient Name, UID, Phone number, or Assigned Doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>Review:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Cases</option>
              <option value="Completed">Completed</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MODERATE">MODERATE</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '3rem 0' }}>Loading master registry...</p>
        ) : filteredPatients.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '3rem 0' }}>No patients match the given criteria.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient UID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Demographics</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Doctor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Appointment</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Workstation</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--primary)' }}>{p.patient_uid}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{p.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-500)' }}>{p.age} Yrs / {p.gender}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-600)' }}>{p.phone}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--slate-800)' }}>{p.assigned_doctor}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--slate-600)' }}>{p.appointment_date}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: p.risk_level === 'CRITICAL' || p.risk_level === 'HIGH' ? 'var(--rose-600)' : p.risk_level === 'LOW' ? 'var(--emerald-600)' : 'var(--slate-600)' }}>
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
                        onClick={() => navigate(`/doctor/workstation?patientId=${p.id}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: 'var(--slate-900)',
                          color: '#ffffff',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        Inspect <ArrowRight size={13} />
                      </button>
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