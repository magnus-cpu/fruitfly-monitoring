import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { EyeOff, Eye } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login error:', error);
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1f6f5a_0%,#154235_35%,#0b1f1a_70%)]" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

          <div className="relative z-10 max-w-lg text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-[0.2em]">
              Precision Agriculture
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-black leading-tight">
              FruitFly Monitoring that protects yield and reputation.
            </h1>
            <p className="mt-4 text-white/80 text-base md:text-lg">
              We connect gateways and field sensors to deliver live insect pressure, humidity, and
              temperature insights so teams act before loss happens.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/85">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Live alerts for rising fruit fly counts.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Geo-mapped assets and gateway coverage.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Reports ready for compliance and audits.
              </div>
            </div>

            <div className="mt-8 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5">
              <img
                src="https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?q=80&w=1200&auto=format&fit=crop"
                alt="Orchard monitoring"
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
                <h2 className="text-3xl font-bold">Welcome back</h2>
                <p className="text-sm text-slate-600 mt-1">Log in to manage sensors and live maps.</p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-500 hover:text-slate-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 transition disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="mt-5 text-sm text-center text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-emerald-700 hover:text-emerald-800 font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
