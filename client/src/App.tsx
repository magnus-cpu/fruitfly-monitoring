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
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import SystemTelemetry from './pages/SystemTelemetry';
import FruitflyImages from './pages/FruitflyImages';
import DataView from './pages/DataView';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<LandingPage />} />
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
              path="/sensors"
              element={
                <ProtectedRoute>
                  <DataView />
                </ProtectedRoute>
              }
            />
            <Route path="/data" element={<Navigate to="/sensors" replace />} />
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
              path="/system-telemetry"
              element={
                <ProtectedRoute>
                  <SystemTelemetry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fruitfly-images"
              element={
                <ProtectedRoute>
                  <FruitflyImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
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
          </Routes>
          <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
