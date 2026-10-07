import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { 
  Stethoscope, 
  Play, 
  RotateCw,
  FileDown, 
  CheckCircle2, 
  Activity, 
  FileEdit
} from 'lucide-react';

export default function DoctorWorkstation() {
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState([]);
  const [scopeFilter, setScopeFilter] = useState('my'); // 'my' or 'all'
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ? parseInt(initialPatientId, 10) : null);
  const [patientData, setPatientData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    loadPatients(scopeFilter);
  }, [scopeFilter]);

  const loadPatients = async (scope) => {
    try {
      setLoading(true);
      const res = await doctorAPI.getAssignedPatients(scope);
      setPatients(res.data);
      if (initialPatientId) {
        handleSelectPatient(parseInt(initialPatientId, 10));
      } else if (res.data.length > 0 && !selectedPatientId) {
        handleSelectPatient(res.data[0].patient_id);
      }
    } catch (err) {
      setErrorMessage('Failed to load patient queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId) => {
    setSelectedPatientId(patientId);
    setLoadingDetails(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const res = await doctorAPI.getPatientProfile(patientId);
      setPatientData(res.data);
      if (res.data.doctor_notes) {
        setClinicalNotes(res.data.doctor_notes.clinical_notes || '');
        setRecommendation(res.data.doctor_notes.recommendation || '');
        setFollowUpDate(res.data.doctor_notes.follow_up_date ? res.data.doctor_notes.follow_up_date.slice(0, 10) : '');
      } else {
        setClinicalNotes('');
        setRecommendation('');
        setFollowUpDate('');
      }
    } catch (err) {
      setErrorMessage('Failed to load patient records.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedPatientId) return;
    setRunningAnalysis(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      await doctorAPI.runAnalysis(selectedPatientId);
      setStatusMessage('Multimodal AI analysis complete. Grad-CAM and risk scores updated.');
      await handleSelectPatient(selectedPatientId);
      const res = await doctorAPI.getAssignedPatients(scopeFilter);
      setPatients(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Inference pipeline failed.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    setSavingNotes(true);
    setStatusMessage('');

    try {
      await doctorAPI.addDoctorNotes({
        patient_id: selectedPatientId,
        clinical_notes: clinicalNotes,
        recommendation: recommendation,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
      });
      setStatusMessage('Physician clinical consultation sign-off successfully committed.');
    } catch (err) {
      setErrorMessage('Failed to save doctor directives.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatientId) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/doctor/report/${selectedPatientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('PDF retrieval failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${patientData?.patient?.patient_uid || 'BoneScan'}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setErrorMessage('Could not download oncological report PDF.');
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
    <div style={{ maxWidth: '1440px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Workstation Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Oncology Diagnostic Workstation
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
          Deep learning skeletal radiograph inference, targeted Grad-CAM interpretability, and physician notes sign-off.
        </p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #a7f3d0', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ backgroundColor: '#fff1f2', color: '#be123c', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #fecdd3', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Main Two-Column Canvas */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Left Side: Selectable Queue */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Patient Queue ({patients.length})
            </h2>

            <div style={{ display: 'flex', backgroundColor: 'var(--slate-100)', padding: '0.2rem', borderRadius: '8px' }}>
              <button
                onClick={() => setScopeFilter('my')}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: scopeFilter === 'my' ? '#ffffff' : 'transparent',
                  color: scopeFilter === 'my' ? 'var(--primary)' : 'var(--slate-600)',
                  boxShadow: scopeFilter === 'my' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                My Cases
              </button>
              <button
                onClick={() => setScopeFilter('all')}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: scopeFilter === 'all' ? '#ffffff' : 'transparent',
                  color: scopeFilter === 'all' ? 'var(--primary)' : 'var(--slate-600)',
                  boxShadow: scopeFilter === 'all' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                All Hospital
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>Loading queue...</p>
          ) : patients.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>No patient records available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {patients.map((p) => {
                const badge = getRiskBadge(p.risk_level);
                const isSelected = selectedPatientId === p.patient_id;

                return (
                  <div
                    key={p.patient_id}
                    onClick={() => handleSelectPatient(p.patient_id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--slate-200)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--slate-900)' }}>{p.name}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px'
                      }}>
                        {p.risk_level}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>UID: {p.patient_uid}</span>
                      <span>{p.age} Yrs / {p.gender}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                      Slot: {p.appointment_date}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Workspace */}
        <div>
          {!selectedPatientId ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '4rem 2rem', textAlign: 'center', color: 'var(--slate-400)' }}>
              <Stethoscope size={48} color="var(--slate-300)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-700)' }}>Select a Patient Record</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.25rem' }}>Choose an assigned case from the queue to view radiographs, run AI multimodal models, and log clinical directives.</p>
            </div>
          ) : loadingDetails ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
              Loading patient diagnostic records...
            </div>
          ) : patientData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Patient Banner */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>{patientData.patient.name}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                      UID: <b>{patientData.patient.patient_uid}</b> | Blood Group: <b>{patientData.patient.blood_group}</b> | Phone: <b>{patientData.patient.phone}</b>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleRunAnalysis}
                      disabled={runningAnalysis}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        backgroundColor: patientData.prediction ? 'var(--slate-800)' : 'var(--primary)',
                        color: '#ffffff',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        boxShadow: 'var(--shadow-sm)',
                        border: 'none',
                        cursor: runningAnalysis ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {patientData.prediction ? <RotateCw size={16} /> : <Play size={16} />}
                      {runningAnalysis 
                        ? 'Executing Inference...' 
                        : patientData.prediction 
                          ? 'Re-run Analysis' 
                          : 'Run AI Analysis'}
                    </button>

                    {patientData.prediction && (
                      <button
                        onClick={handleDownloadPDF}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          backgroundColor: '#ffffff',
                          color: 'var(--slate-800)',
                          border: '1px solid var(--slate-300)',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                      >
                        <FileDown size={16} /> Download PDF Dossier
                      </button>
                    )}
                  </div>
                </div>

                {/* Serological Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-100)' }}>
                  <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Alkaline Phosphatase (ALP)</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: patientData.biomarkers?.alp > 147 ? 'var(--rose-600)' : 'var(--slate-900)' }}>
                      {patientData.biomarkers?.alp} U/L
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Ref: 44 - 147 U/L</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Osteopontin (OPN)</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: patientData.biomarkers?.opn > 55 ? 'var(--rose-600)' : 'var(--slate-900)' }}>
                      {patientData.biomarkers?.opn} ng/mL
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Ref: 15 - 55 ng/mL</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>25-OH Vitamin D</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: patientData.biomarkers?.vitamin_d < 30 ? 'var(--rose-600)' : 'var(--slate-900)' }}>
                      {patientData.biomarkers?.vitamin_d} ng/mL
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Ref: 30 - 100 ng/mL</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Reported Pain</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: patientData.biomarkers?.pain_level === 'HIGH' ? 'var(--rose-600)' : 'var(--slate-900)' }}>
                      {patientData.biomarkers?.pain_level}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Clinical Symptom Index</div>
                  </div>
                </div>
              </div>

              {/* Multimodal Section */}
              {patientData.prediction ? (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--slate-900)' }}>
                    Multimodal Synthesis & Lesion Localization
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>ResNet-50 CNN Classification</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: patientData.xray.cnn_prediction.toLowerCase() === 'cancer' ? 'var(--rose-600)' : 'var(--emerald-600)', marginTop: '0.2rem' }}>
                        {patientData.xray.cnn_prediction.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                        Confidence: {patientData.xray.confidence_score}%
                      </div>
                    </div>

                    <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>Random Forest Biomarker Evaluation</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.2rem' }}>
                        Risk Score: {patientData.biomarkers.biomarker_risk_score}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                        Status: {patientData.biomarkers.biomarker_prediction}
                      </div>
                    </div>

                    <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>Late-Fusion Risk Classification</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getRiskBadge(patientData.prediction.risk_level).text, marginTop: '0.2rem' }}>
                        {patientData.prediction.risk_level} ({patientData.prediction.fused_score}%)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                        {patientData.prediction.final_diagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Scans Overlay */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.75rem' }}>
                        Original Bone Radiograph
                      </div>
                      <img
                        src={`http://127.0.0.1:8000/${patientData.xray.image_path}`}
                        alt="Original Radiograph"
                        style={{ maxHeight: '280px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                      />
                    </div>

                    <div style={{ border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.75rem' }}>
                        Grad-CAM Explainability Heatmap
                      </div>
                      {patientData.xray.gradcam_path ? (
                        <img
                          src={`http://127.0.0.1:8000/${patientData.xray.gradcam_path}?t=${new Date().getTime()}`}
                          alt="Grad-CAM Overlay"
                          style={{ maxHeight: '280px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate-50)', borderRadius: '8px', padding: '1rem' }}>
                          <CheckCircle2 size={36} color="var(--emerald-600)" style={{ marginBottom: '0.5rem' }} />
                          <span style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9rem' }}>Localization Overlay Omitted</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'center', marginTop: '0.25rem', maxWidth: '240px' }}>
                            Model determined scan to be non-malignant. Explainability heatmap is generated conditionally for malignant predictions.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-subtle)', borderRadius: '10px', padding: '1rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>System Diagnostic Directive:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--slate-800)', marginTop: '0.25rem' }}>{patientData.prediction.ai_recommendation}</p>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '2.5rem', textAlign: 'center' }}>
                  <Activity size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-800)' }}>Awaiting Multimodal Analysis</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                    Click <b>"Run AI Analysis"</b> to calculate the ResNet-50 predictions, generate Grad-CAM visualizer maps, and combine with the biomarker model.
                  </p>
                </div>
              )}

              {/* Attending Physician Sign-Off Form */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: '14px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <FileEdit size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>Attending Oncologist Sign-Off</h3>
                </div>

                <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                      Clinical Observation & Diagnostic Review *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Radiological correlation confirms aggressive osteolytic lesion at proximal tibia with periosteal reaction..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                      Physician Directives & Treatment Recommendations *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Recommend immediate 3T MRI with IV contrast and core needle biopsy under CT guidance."
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
                    />
                  </div>

                  <div style={{ maxWidth: '280px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.4rem' }}>
                      Follow-up Consultation Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--slate-300)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingNotes}
                    style={{
                      backgroundColor: 'var(--slate-900)',
                      color: '#ffffff',
                      padding: '0.8rem 1.6rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      alignSelf: 'flex-start',
                      boxShadow: 'var(--shadow-xs)',
                      border: 'none',
                      cursor: savingNotes ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingNotes ? 'Saving Review...' : 'Sign & Finalize Consultation'}
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}