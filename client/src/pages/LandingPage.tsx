import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Radar,
  ShieldCheck,
  Sprout,
  Waves,
  X
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../api/Sapi';

type ApiErrorResponse = {
  message?: string;
  errors?: Array<{ msg?: string }>;
};

interface AuthModalProps {
  mode: 'login' | 'register' | null;
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
}

interface LandingFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: number;
    name: string;
    location: string;
    entity: 'sensor' | 'gateway';
    gateway_id?: number;
    activity_status?: string;
    insects?: number;
  };
}

interface LandingResponse {
  type: 'FeatureCollection';
  features: LandingFeature[];
  summary: {
    gateways: number;
    sensors: number;
    activeSensors: number;
    coverageAreas: number;
  };
}

const gatewayIcon = new L.DivIcon({
  html: `
    <span class="landing-marker landing-marker-gateway">
      <span class="landing-marker-pulse"></span>
      <span class="landing-marker-dot"></span>
    </span>
  `,
  className: 'landing-map-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const sensorIcon = new L.DivIcon({
  html: `
    <span class="landing-marker landing-marker-sensor">
      <span class="landing-marker-pulse"></span>
      <span class="landing-marker-dot"></span>
    </span>
  `,
  className: 'landing-map-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const defaultCenter: [number, number] = [-6.369, 34.8888];

const FitLandingMapToFeatures: React.FC<{ features: LandingFeature[] }> = ({ features }) => {
  const map = useMap();

  useEffect(() => {
    if (!features.length) {
      map.setView(defaultCenter, 6, { animate: true });
      return;
    }

    if (features.length === 1) {
      const [lng, lat] = features[0].geometry.coordinates;
      map.flyTo([lat, lng], 12, { animate: true, duration: 1.1 });
      return;
    }

    const bounds = L.latLngBounds(
      features.map((feature) => [
        feature.geometry.coordinates[1],
        feature.geometry.coordinates[0],
      ])
    );

    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12,
      duration: 1.2,
    });
  }, [features, map]);

  return null;
};

const LandingMap: React.FC<{ features: LandingFeature[]; loading: boolean }> = ({
  features,
  loading,
}) => {
  const sensors = features.filter((feature) => feature.properties.entity === 'sensor');
  const gateways = features.filter((feature) => feature.properties.entity === 'gateway');
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/35 shadow-2xl shadow-black/25">
      <style>{`
        .landing-map-marker {
          background: transparent;
          border: 0;
        }
        .landing-marker {
          position: relative;
          display: block;
          width: 22px;
          height: 22px;
        }
        .landing-marker-sensor {
          width: 20px;
          height: 20px;
        }
        .landing-marker-pulse {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          animation: landingPulse 2.2s ease-out infinite;
          opacity: 0.55;
        }
        .landing-marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 12px;
          height: 12px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        }
        .landing-marker-gateway .landing-marker-pulse {
          background: rgba(251, 191, 36, 0.32);
        }
        .landing-marker-gateway .landing-marker-dot {
          background: #fbbf24;
        }
        .landing-marker-sensor .landing-marker-pulse {
          background: rgba(52, 211, 153, 0.3);
          animation-duration: 1.9s;
        }
        .landing-marker-sensor .landing-marker-dot {
          background: #34d399;
          width: 11px;
          height: 11px;
        }
        @keyframes landingPulse {
          0% {
            transform: scale(0.65);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.9);
            opacity: 0;
          }
          100% {
            transform: scale(1.9);
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute inset-x-0 top-0 z-[500] flex items-center justify-between border-b border-white/10 bg-slate-950/55 px-5 py-4 text-white backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/75">Coverage area map</p>
          <p className="mt-1 text-lg font-semibold">
            {loading ? 'Loading live map...' : 'Real device coordinates'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Visible points</p>
          <p className="mt-1 text-2xl font-semibold text-white">{features.length}</p>
        </div>
      </div>

      <div className="h-[440px] pt-[82px]">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            referrerPolicy="strict-origin-when-cross-origin"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitLandingMapToFeatures features={features} />

          {gateways.map((feature) => (
            <Marker
              key={`gateway-${feature.properties.id}`}
              position={[
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ]}
              icon={gatewayIcon}
            >
              <Popup>
                <div className="min-w-[170px]">
                  <p className="font-semibold text-slate-900">{feature.properties.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{feature.properties.location}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Gateway
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {sensors.map((feature) => (
            <Marker
              key={`sensor-${feature.properties.id}`}
              position={[
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ]}
              icon={sensorIcon}
            >
              <Popup>
                <div className="min-w-[170px]">
                  <p className="font-semibold text-slate-900">{feature.properties.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{feature.properties.location}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Sensor
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitch }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!mode) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      navigate('/dashboard');
      onClose();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const fieldErrors = err.response?.data?.errors
          ?.map((item) => item.msg)
          .filter(Boolean);
        setError(
          fieldErrors?.length
            ? fieldErrors.join(', ')
            : err.response?.data?.message || 'Invalid email or password'
        );
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const responseMessage = await register(
        registerForm.username,
        registerForm.email,
        registerForm.password
      );
      setMessage(responseMessage || 'Account created. You can log in now.');
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      onSwitch('login');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const fieldErrors = err.response?.data?.errors
          ?.map((item) => item.msg)
          .filter(Boolean);
        setError(
          fieldErrors?.length
            ? fieldErrors.join(', ')
            : err.response?.data?.message || 'Registration failed. Please try again.'
        );
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#f5f0e7] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-200 bg-gradient-to-r from-[#16271f] via-[#1c382d] to-[#203024] px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">
            {mode === 'login' ? 'Login' : 'Register'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {mode === 'login' ? 'Login' : 'Register'}
          </h2>
          <p className="mt-2 text-sm text-slate-200">
            {mode === 'login'
              ? 'Enter the monitoring workspace.'
              : 'Create a manager account and start monitoring.'}
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => onSwitch('login')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onSwitch('register')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === 'register'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@farm.co"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Choose a username"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@farm.co"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Create a password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm password
                </label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Register'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [modalMode, setModalMode] = useState<'login' | 'register' | null>(null);
  const [landingData, setLandingData] = useState<LandingResponse | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    const loadLandingData = async () => {
      try {
        setMapLoading(true);
        const { data } = await api.get<LandingResponse>('/locations/public');
        setLandingData(data);
      } catch (error) {
        console.error('Failed to load landing map data', error);
      } finally {
        setMapLoading(false);
      }
    };

    loadLandingData();
  }, []);

  const features = landingData?.features ?? [];
  const summary = landingData?.summary ?? {
    gateways: 0,
    sensors: 0,
    activeSensors: 0,
    coverageAreas: 0,
  };

  const previewLocations = useMemo(
    () =>
      Array.from(
        new Set(features.map((feature) => feature.properties.location).filter(Boolean))
      ).slice(0, 5),
    [features]
  );

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen bg-[#f3eee3] text-slate-900"
      style={{ fontFamily: '"Fraunces", "Iowan Old Style", "Georgia", serif' }}
    >
      <section className="relative overflow-hidden bg-[#10231c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_26%),linear-gradient(135deg,#10231c_0%,#173227_55%,#0f1e18_100%)]" />
        <div className="relative">
          <header className="relative z-20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                    Fruitfly Platform
                  </p>
                  <p className="text-lg font-semibold text-white">iFF Trap</p>
                </div>
              </Link>

              <nav className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white sm:px-4"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:px-4"
                >
                  Register
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-20 lg:pt-12">
            <div className="relative z-10 max-w-2xl self-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-200/80">
                <Sprout className="h-3.5 w-3.5" />
                Live field briefing
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[0.95] text-white sm:text-6xl">
                Real monitoring locations before you sign in.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Explore the actual coverage footprint, active sensors, and gateway presence already running inside the platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setModalMode('login')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Login
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('register')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Register
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-200 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Gateways</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.gateways}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Sensors</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.sensors}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Active</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.activeSensors}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Areas</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.coverageAreas}</p>
                </div>
              </div>

              {previewLocations.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {previewLocations.map((location) => (
                    <span
                      key={location}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="relative z-10">
              <LandingMap features={features} loading={mapLoading} />
            </div>
          </main>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">What you can see</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
                The platform explains itself before anyone enters.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="border-t border-slate-300 pt-5">
                <p className="text-lg font-semibold text-slate-900">Live farm map</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  View the real farm locations connected to the system and see where monitoring devices are placed.
                </p>
              </div>
              <div className="border-t border-slate-300 pt-5">
                <p className="text-lg font-semibold text-slate-900">What is connected</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Quickly understand how many gateways and sensors are available and how many are currently active.
                </p>
              </div>
              <div className="border-t border-slate-300 pt-5">
                <p className="text-lg font-semibold text-slate-900">Easy access</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Start quickly with simple Login and Register options shown clearly at the top of the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Workflow</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
              One route from field capture to action.
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Capture field conditions',
                body: 'Gateways, sensors, and trap images collect the environmental and fruit fly signals that matter on site.',
                icon: MapPin,
              },
              {
                step: '02',
                title: 'Review maps and images',
                body: 'Managers open coverage, inspect captures, and understand where activity is changing before it becomes loss.',
                icon: Waves,
              },
              {
                step: '03',
                title: 'Respond and document',
                body: 'Teams export reports, review history, and keep a record of monitoring decisions across the season.',
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-[72px_1fr]">
                  <div className="flex items-center gap-3 sm:block">
                    <span className="text-sm font-semibold text-slate-400">{item.step}</span>
                    <div className="mt-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:mt-4">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AuthModal
        mode={modalMode}
        onClose={() => setModalMode(null)}
        onSwitch={setModalMode}
      />
    </div>
  );
};

export default LandingPage;
