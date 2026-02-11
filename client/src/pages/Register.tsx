import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { EyeOff, Eye } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
   const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

try {
  setLoading(true);
  await register(username, email, password);
  navigate('/login');
} catch (error) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as { response?: { data?: { message?: string, errors?: Array<{msg: string}> } } };

    if (err.response?.data?.errors && err.response.data.errors.length > 0) {
      // Join all error messages
      setError(err.response.data.errors.map(e => e.msg).join(', '));
    } else {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  } else {
    setError('Registration failed. Please try again.');
  }
} finally {
  setLoading(false);
}

  };

  return (
    <div
      className="min-h-screen bg-[#f6f2ea] text-slate-900"
      style={{ fontFamily: '"Fraunces", "Iowan Old Style", "Garamond", "Times New Roman", serif' }}
    >
      <div className="min-h-screen grid lg:grid-cols-2">
        <section className="relative overflow-hidden flex items-center justify-center p-8 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#6d3f27_0%,#3d2418_35%,#1a0f0a_70%)]" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative z-10 max-w-lg text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-[0.2em]">
              FruitFly Platform
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-black leading-tight">
              Turn field data into confident decisions.
            </h1>
            <p className="mt-4 text-white/80 text-base md:text-lg">
              Deploy gateways and sensors to track environmental changes and pest activity in real time.
              Reduce loss, document interventions, and improve seasonal outcomes.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/85">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Set up in minutes with site-ready devices.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Live maps show sensor health and coverage.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Export reports for compliance and growers.
              </div>
            </div>

            <div className="mt-8 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
                alt="Farm landscape"
                className="h-56 w-full object-cover"
              />
            </div>
          </div>
          <div className="pointer-events-none absolute top-0 right-0 h-full w-24 hidden lg:block">
            <svg viewBox="0 0 120 1000" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0,0 C70,120 70,880 0,1000 L120,1000 L120,0 Z"
                fill="#f6f2ea"
              />
            </svg>
          </div>
        </section>

        <section className="flex items-center justify-center p-8 lg:p-14">
          <div className="w-full max-w-md">
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold">Create your account</h2>
                <p className="text-sm text-slate-600 mt-1">Start monitoring your orchard today.</p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="email"
                    type="email"
                    placeholder="you@farm.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-500 hover:text-slate-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 transition disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-5 text-sm text-center text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-700 hover:text-amber-800 font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
