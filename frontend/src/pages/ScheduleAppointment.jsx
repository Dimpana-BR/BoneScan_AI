import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { receptionistAPI } from '../services/api';
import { Calendar, CheckCircle2, AlertCircle, Building2, User, ArrowLeft } from 'lucide-react';

export default function ScheduleAppointment() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [department, setDepartment] = useState('Orthopedic Oncology');
  
  const minDate = new Date().toISOString().slice(0, 10);
  const [appointmentDate, setAppointmentDate] = useState(minDate);
  const [timeSlot, setTimeSlot] = useState('10:00 AM');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const timeOptions = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [pRes, dRes] = await Promise.all([
        receptionistAPI.getAllPatients(),
        receptionistAPI.getDoctors()
      ]);
      setPatients(pRes.data);
      setDoctors(dRes.data);
      if (dRes.data.length > 0) setSelectedDoctorId(dRes.data[0].id);
      if (pRes.data.length > 0 && !preselectedPatientId) setSelectedPatientId(pRes.data[0].id);
    } catch (err) {
      setErrorMessage('Failed to load clinic scheduling data.');
    } finally {
      setLoading(false);
    }
  };

  const parseDateTime = (dateStr, slotStr) => {
    const [time, modifier] = slotStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
    if (modifier === 'AM' && hours === '12') hours = '00';
    return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${minutes}:00`);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessData(null);

    const fullDate = parseDateTime(appointmentDate, timeSlot);
    if (fullDate < new Date()) {
      setErrorMessage('Selected appointment slot is in the past. Please choose a future slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await receptionistAPI.bookAppointment({
        patient_id: parseInt(selectedPatientId, 10),
        doctor_id: parseInt(selectedDoctorId, 10),
        appointment_date: fullDate.toISOString()
      });
      setSuccessData(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to schedule appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--slate-200)', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--emerald-50)', color: 'var(--emerald-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>Appointment Confirmed</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Consultation slot has been scheduled and updated in the doctor's queue.
          </p>

          <div style={{ backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '1.25rem', margin: '1.5rem 0', textAlign: 'left', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--slate-500)' }}>Appointment ID:</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>#{successData.appointment_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--slate-500)' }}>Patient:</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>{successData.patient_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--slate-500)' }}>Attending Doctor:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{successData.doctor_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--slate-500)' }}>Scheduled Slot:</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>{successData.appointment_date}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setSuccessData(null)}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Book Another
            </button>
            <button
              onClick={() => navigate('/receptionist')}
              style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid var(--slate-300)', color: 'var(--slate-700)', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Receptionist Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <button
        onClick={() => navigate('/receptionist')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Return to Dashboard
      </button>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--slate-200)', padding: '2.25rem', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Calendar size={24} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>Schedule Oncology Consultation</h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>Assign clinical appointment time slots to enrolled patients.</p>
          </div>
        </div>

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--rose-50)', color: 'var(--rose-600)', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
              Select Enrolled Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.patient_uid}) — Phone: {p.phone}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Clinical Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                <option value="Orthopedic Oncology">Orthopedic Oncology</option>
                <option value="Musculoskeletal Radiology">Musculoskeletal Radiology</option>
                <option value="Surgical Oncology">Surgical Oncology</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Attending Oncologist *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Consultation Date *
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Available Slot (AM/PM) *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                {timeOptions.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            style={{
              marginTop: '0.75rem',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}