import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import RegisterPatient from './pages/RegisterPatient';
import ScheduleAppointment from './pages/ScheduleAppointment';
import PatientDirectory from './pages/PatientDirectory';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorWorkstation from './pages/DoctorWorkstation';
import DoctorPatientDirectory from './pages/DoctorPatientDirectory';

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRoute() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (token && role === 'receptionist') {
    return <Navigate to="/receptionist" replace />;
  }
  if (token && role === 'doctor') {
    return <Navigate to="/doctor" replace />;
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            
            {/* Receptionist Portal Routes */}
            <Route path="/receptionist" element={
              <ProtectedRoute allowedRole="receptionist">
                <ReceptionistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/register" element={
              <ProtectedRoute allowedRole="receptionist">
                <RegisterPatient />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/appointments" element={
              <ProtectedRoute allowedRole="receptionist">
                <ScheduleAppointment />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/search" element={
              <ProtectedRoute allowedRole="receptionist">
                <PatientDirectory />
              </ProtectedRoute>
            } />
            
            {/* Doctor Portal Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/workstation" element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorWorkstation />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorPatientDirectory />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}