import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './pages/Reports';
import Sensors from './pages/Sensors';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import GateWays from './pages/gateways';
import AdminContent from './pages/AdminContent';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gateways/:id/sensors"
              element={
                <ProtectedRoute>
                  <Sensors />
                </ProtectedRoute>
              }
            />
            <Route
            path="/gateways"
              element={
                <ProtectedRoute>
                  <GateWays />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <ProtectedRoute>
                  <AdminContent />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
