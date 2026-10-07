import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistAPI } from '../services/api';
import { 
  UserPlus, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Calendar, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    email: '',
    phone: '',
    blood_group: 'O+',
    address: '',
    alp: '',
    opn: '',
    vitamin_d: '',
    pain_level: 'MEDIUM'
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [xrayFile, setXrayFile] = useState(null);
  const [xrayPreview, setXrayPreview] = useState(null);

  const validateInputs = () => {
    const errors = {};
    
    // Strict 10-Digit Phone
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits (e.g. 9876543210).';
    }

    // Email format validation
    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please provide a valid email format (e.g. name@domain.com).';
      }
    }

    if (formData.alp && Number(formData.alp) <= 0) errors.alp = 'ALP must be greater than 0.';
    if (formData.opn && Number(formData.opn) <= 0) errors.opn = 'OPN must be greater than 0.';
    if (formData.vitamin_d && Number(formData.vitamin_d) <= 0) errors.vitamin_d = 'Vitamin D must be greater than 0.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setXrayFile(file);
      setXrayPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateInputs()) return;

    if (!xrayFile) {
      setErrorMessage('Please upload the patient\'s skeletal radiograph (X-ray).');
      return;
    }

    setSubmitting(true);
    const submission = new FormData();
    Object.keys(formData).forEach((key) => {
      submission.append(key, formData[key]);
    });
    submission.append('xray_file', xrayFile);

    try {
      const res = await receptionistAPI.registerPatient(submission);
      setRegisteredPatient({
        id: res.data.patient_id,
        uid: res.data.patient_uid,
        name: res.data.name
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to complete patient registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredPatient) {
    return (
      <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--slate-200)',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--emerald-50)',
            color: 'var(--emerald-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            border: '2px solid #a7f3d0'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            Patient Registered Successfully!
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Demographic profile, serological biomarkers, and bone scan are logged in the clinical database.
          </p>

          <div style={{
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '2rem 0',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Assigned Patient UID:</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>{registeredPatient.uid}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>Patient Full Name:</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)' }}>{registeredPatient.name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/receptionist/appointments?patientId=${registeredPatient.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                padding: '0.8rem 1.6rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.92rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Calendar size={18} /> Book Appointment Now
            </button>
            <button
              onClick={() => navigate('/receptionist')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: 'var(--slate-700)',
                border: '1px solid var(--slate-300)',
                padding: '0.8rem 1.6rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem'
              }}
            >
              <LayoutDashboard size={18} /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Register New Patient
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
          Enroll patient demographics, upload skeletal X-rays, and catalog clinical serum biomarkers.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backgroundColor: 'var(--rose-50)',
          color: 'var(--rose-600)',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid #fecdd3',
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Demographics */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <UserPlus size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-800)' }}>1. Patient Demographics</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Age *
              </label>
              <input
                type="number"
                name="age"
                required
                placeholder="e.g. 48"
                value={formData.age}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Contact Phone (Exact 10 Digits) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                placeholder="e.g. 9845123456"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: `1px solid ${validationErrors.phone ? 'var(--rose-500)' : 'var(--slate-300)'}` }}
              />
              {validationErrors.phone && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-600)', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.phone}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="patient@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: `1px solid ${validationErrors.email ? 'var(--rose-500)' : 'var(--slate-300)'}` }}
              />
              {validationErrors.email && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-600)', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Blood Group *
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Biomarkers */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileSpreadsheet size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-800)' }}>2. Serological Biomarkers & Pain Level</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Alkaline Phosphatase (ALP) [U/L] *
              </label>
              <input
                type="number"
                step="0.01"
                name="alp"
                required
                placeholder="Normal: 44 - 147"
                value={formData.alp}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Osteopontin (OPN) [ng/mL] *
              </label>
              <input
                type="number"
                step="0.01"
                name="opn"
                required
                placeholder="Normal: 15 - 55"
                value={formData.opn}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                25-OH Vitamin D [ng/mL] *
              </label>
              <input
                type="number"
                step="0.01"
                name="vitamin_d"
                required
                placeholder="Normal: 30 - 100"
                value={formData.vitamin_d}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                Reported Pain Severity *
              </label>
              <select
                name="pain_level"
                value={formData.pain_level}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid var(--slate-300)', backgroundColor: '#fff' }}
              >
                <option value="LOW">Low (Mild / Intermittent)</option>
                <option value="MEDIUM">Medium (Persistent Localized)</option>
                <option value="HIGH">High (Severe / Nocturnal Bone Pain)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Skeletal Radiograph Upload */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid var(--slate-200)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Upload size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-800)' }}>3. Skeletal Radiograph (X-ray Scan)</h2>
          </div>

          <div style={{
            border: '2px dashed var(--slate-300)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--slate-50)',
            position: 'relative'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            {xrayPreview ? (
              <div>
                <img
                  src={xrayPreview}
                  alt="Bone Scan Preview"
                  style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'contain', margin: '0 auto 0.75rem auto' }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--emerald-600)', fontWeight: 700 }}>Attached: {xrayFile?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Click to replace file</p>
              </div>
            ) : (
              <div>
                <Upload size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-700)' }}>Upload Skeletal Bone Radiograph</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>JPEG, PNG, or DICOM exports up to 25MB</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            padding: '0.95rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Registering Patient...' : 'Register Patient'}
        </button>
      </form>
    </div>
  );
}