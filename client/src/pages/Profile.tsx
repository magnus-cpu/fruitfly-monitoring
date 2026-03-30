import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Edit3,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
  MapPin,
  Radio,
  ShieldCheck,
  Trash2,
  User,
  UserPlus2,
  Users,
  Wifi,
  X
} from 'lucide-react';
import type { ProfileProps } from '../types/profileTypes';
import api from '../api/Sapi';
import BackButton from '../components/BackButton';
import { formatLocalDate, getAppTimestamp } from '../utils/datetime';

interface Sensor {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Gateway {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  created_at: string;
}

interface TeamMember {
  id: number;
  username: string;
  email: string;
  role: 'viewer';
  created_at: string;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
  onValueChange: (value: string) => void;
}

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  subtitle: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  hint,
  icon,
  endAdornment,
  onValueChange,
  className,
  ...props
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
      {icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition group-focus-within:text-indigo-600">
          {icon}
        </span>
      )}
      <input
        {...props}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 ${className ?? ''}`}
      />
      {endAdornment}
    </div>
    {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
  </label>
);

const Modal: React.FC<ModalProps> = ({
  children,
  open,
  setOpen,
  title,
  subtitle,
}) =>
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 px-6 py-5 text-white">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-slate-200">{subtitle}</p>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  ) : null;

const formatRole = (role?: ProfileProps['role']) => {
  if (!role) return 'Account';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileProps | null>(null);
  const nav = useNavigate();

  const [showUpdate, setShowUpdate] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCreateViewer, setShowCreateViewer] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamForm, setTeamForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    viewer: false,
    viewerConfirm: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.get('/users/profile');
      setProfile(data.data);

      const response = await api.get('/sensors');
      setSensors(response.data);

      const gatewaysRes = await api.get('/gateways');
      setGateways(gatewaysRes.data);

      if (data.data?.role === 'manager') {
        const teamRes = await api.get('/users/team-members');
        setTeamMembers(teamRes.data.users ?? []);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!profile) return;
    setForm({
      username: profile.username || '',
      email: profile.email || '',
      currentPassword: '',
      newPassword: '',
    });
  }, [profile]);

  const isViewer = profile?.role === 'viewer';
  const totalDevices = sensors.length + gateways.length;

  const recentDevices = useMemo(
    () =>
      [
        ...gateways.map((gateway) => ({ ...gateway, type: 'Gateway' as const })),
        ...sensors.map((sensor) => ({ ...sensor, type: 'Sensor' as const })),
      ]
        .sort(
          (a, b) =>
            getAppTimestamp(b.created_at) - getAppTimestamp(a.created_at)
        )
        .slice(0, 6),
    [gateways, sensors]
  );

  const teamFieldClassName =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100';

  const togglePasswordVisibility = (
    key: 'current' | 'next' | 'viewer' | 'viewerConfirm'
  ) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const passwordToggleButtonClassName =
    'flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-indigo-600';

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', {
        username: form.username,
        email: form.email,
      });
      setProfile(data);
      setMsg({ text: 'Profile updated successfully.', ok: true });
      setShowUpdate(false);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setMsg({ text: e.response.data?.message || 'Error', ok: false });
      } else {
        setMsg({ text: 'Error', ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePass = async () => {
    setLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMsg({ text: 'Password changed successfully.', ok: true });
      setShowPass(false);
      setForm({ ...form, currentPassword: '', newPassword: '' });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setMsg({ text: e.response.data?.message || 'Error', ok: false });
      } else {
        setMsg({ text: 'Error', ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/users/profile');
      logout();
      nav('/login');
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setMsg({ text: e.response.data?.message || 'Error', ok: false });
      } else {
        setMsg({ text: 'Error', ok: false });
      }
      setLoading(false);
    }
  };

  const handleCreateViewer = async () => {
    if (teamForm.password !== teamForm.confirmPassword) {
      setMsg({ text: 'Viewer passwords do not match', ok: false });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/users/team-members', {
        username: teamForm.username,
        email: teamForm.email,
        password: teamForm.password,
      });

      setTeamMembers((prev) => [
        {
          ...data.user,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTeamForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setShowCreateViewer(false);
      setMsg({ text: 'Viewer account created.', ok: true });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setMsg({ text: e.response.data?.message || 'Error', ok: false });
      } else {
        setMsg({ text: 'Error', ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteViewer = async (id: number) => {
    if (!window.confirm('Delete this viewer account?')) return;

    setLoading(true);
    try {
      await api.delete(`/users/team-members/${id}`);
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
      setMsg({ text: 'Viewer account deleted.', ok: true });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setMsg({ text: e.response.data?.message || 'Error', ok: false });
      } else {
        setMsg({ text: 'Error', ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const getGatewayStatusClass = (status: Gateway['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
      case 'offline':
      default:
        return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
    }
  };

  const getSensorStatusClass = (status: Sensor['status']) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
      : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <BackButton />
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_52%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {formatRole(profile.role)} workspace
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
                  <User className="h-10 w-10" />
                </div>
                <div className="max-w-2xl">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {profile.username}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                    Manage your identity, security settings, team access, and the devices assigned to this monitoring workspace.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-200">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <Mail className="h-4 w-4 text-indigo-300" />
                      {profile.email}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <Calendar className="h-4 w-4 text-cyan-300" />
                      Joined {formatLocalDate(profile.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Devices</p>
                <p className="mt-3 text-3xl font-semibold">{totalDevices}</p>
                <p className="mt-1 text-xs text-slate-300">Sensors and gateways</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Gateways</p>
                <p className="mt-3 text-3xl font-semibold">{gateways.length}</p>
                <p className="mt-1 text-xs text-slate-300">Connected field hubs</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Sensors</p>
                <p className="mt-3 text-3xl font-semibold">{sensors.length}</p>
                <p className="mt-1 text-xs text-slate-300">Reporting monitor nodes</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Team</p>
                <p className="mt-3 text-3xl font-semibold">
                  {profile.role === 'manager' ? teamMembers.length : 1}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {profile.role === 'manager' ? 'Viewer accounts assigned' : 'Your account access'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {msg && (
          <div
            className={`mt-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 shadow-sm ${
              msg.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <div>
              <p className="text-sm font-semibold">
                {msg.ok ? 'Update completed' : 'Action needs attention'}
              </p>
              <p className="mt-1 text-sm">{msg.text}</p>
            </div>
            <button
              onClick={() => setMsg(null)}
              className="rounded-full p-1 text-current/70 transition hover:bg-white/60 hover:text-current"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setShowUpdate(true)}
            className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Edit3 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                Edit
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Profile details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Update your display name and contact email using the same design language as the rest of the app.
            </p>
          </button>

          <button
            onClick={() => setShowPass(true)}
            className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Lock className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                Secure
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Password settings</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep this workspace protected by rotating your login password whenever access changes.
            </p>
          </button>

          <button
            onClick={() => setShowDelete(true)}
            className="group rounded-[24px] border border-rose-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">
                Critical
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Delete account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Permanently remove this account and its assigned resources if the workspace is no longer needed.
            </p>
          </button>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Account overview</h2>
                  <p className="text-sm text-slate-500">Core identity and workspace assignment.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Username</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{profile.username}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email address</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{profile.email}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Access role</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{formatRole(profile.role)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Member since</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{formatLocalDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Workspace summary</h2>
                  <p className="text-sm text-slate-500">A quick scan of what this profile can access.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-4">
                  <div className="flex items-center gap-3 text-indigo-700">
                    <Wifi className="h-5 w-5" />
                    <p className="text-sm font-semibold">Gateways</p>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{gateways.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Managed monitoring hubs</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-4">
                  <div className="flex items-center gap-3 text-cyan-700">
                    <Radio className="h-5 w-5" />
                    <p className="text-sm font-semibold">Sensors</p>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{sensors.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Field capture points</p>
                </div>
              </div>
            </section>

            {isViewer && (
              <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-700 ring-1 ring-amber-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-amber-950">Viewer access</h2>
                    <p className="mt-2 text-sm leading-6 text-amber-900/80">
                      This account is read-only for farm monitoring data assigned by a manager. You can still maintain your own profile details and password from this page.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Recent devices</h2>
                    <p className="text-sm text-slate-500">Latest gateways and sensors connected to this account.</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {totalDevices} total
                </span>
              </div>

              {recentDevices.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-slate-700">No devices registered yet.</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Once gateways or sensors are added, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {recentDevices.map((device) => (
                    <div
                      key={`${device.type.toLowerCase()}-${device.id}`}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{device.name}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                            {device.type}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            device.type === 'Gateway'
                              ? getGatewayStatusClass(device.status as Gateway['status'])
                              : getSensorStatusClass(device.status as Sensor['status'])
                          }`}
                        >
                          {device.status}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-500">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {device.location}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          Added {formatLocalDate(device.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {profile.role === 'manager' && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Viewer accounts</h2>
                      <p className="text-sm text-slate-500">
                        Add read-only members who need their own login.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateViewer(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <UserPlus2 className="h-4 w-4" />
                    Add viewer
                  </button>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">No viewer accounts yet.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a read-only team login for staff who only need visibility.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{member.username}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                              {member.role} account • Added {formatLocalDate(member.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteViewer(member.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showUpdate}
        setOpen={setShowUpdate}
        title="Update profile"
        subtitle="Refresh your name and email with the same polished controls used throughout the app."
      >
        <div className="space-y-4">
          <InputField
            label="Username"
            name="username"
            value={form.username}
            placeholder="Enter your username"
            icon={<User className="h-4 w-4" />}
            hint="This name appears across your monitoring workspace."
            onValueChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            placeholder="Enter your email address"
            icon={<Mail className="h-4 w-4" />}
            hint="Use an active address for account notifications and login recovery."
            onValueChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => setShowUpdate(false)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </Modal>

      <Modal
        open={showPass}
        setOpen={setShowPass}
        title="Change password"
        subtitle="Keep this account secure with a fresh password that only you know."
      >
        <div className="space-y-4">
          <InputField
            label="Current password"
            name="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            value={form.currentPassword}
            placeholder="Enter current password"
            icon={<Lock className="h-4 w-4" />}
            hint="We verify your current password before saving a new one."
            endAdornment={
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className={passwordToggleButtonClassName}
                aria-label={showPasswords.current ? 'Hide current password' : 'Show current password'}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, currentPassword: value }))
            }
          />
          <InputField
            label="New password"
            name="newPassword"
            type={showPasswords.next ? 'text' : 'password'}
            value={form.newPassword}
            placeholder="Enter new password"
            icon={<ShieldCheck className="h-4 w-4" />}
            hint="Choose a password that is unique to this platform."
            endAdornment={
              <button
                type="button"
                onClick={() => togglePasswordVisibility('next')}
                className={passwordToggleButtonClassName}
                aria-label={showPasswords.next ? 'Hide new password' : 'Show new password'}
              >
                {showPasswords.next ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, newPassword: value }))
            }
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => setShowPass(false)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePass}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </div>
      </Modal>

      <Modal
        open={showDelete}
        setOpen={setShowDelete}
        title="Delete account"
        subtitle="This permanently removes the account and the resources tied to it."
      >
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 ring-1 ring-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-900">This action is irreversible.</p>
              <p className="mt-1 text-sm leading-6 text-rose-800/90">
                All linked devices, access assignments, and account data will be removed from this workspace.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => setShowDelete(false)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Confirm deletion
          </button>
        </div>
      </Modal>

      <Modal
        open={showCreateViewer}
        setOpen={setShowCreateViewer}
        title="Create viewer account"
        subtitle="Invite a read-only team member with their own secure login."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
            <input
              value={teamForm.username}
              onChange={(e) =>
                setTeamForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Enter viewer username"
              className={teamFieldClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={teamForm.email}
              onChange={(e) =>
                setTeamForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter viewer email"
              className={teamFieldClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <div className="relative">
            <input
              type={showPasswords.viewer ? 'text' : 'password'}
              value={teamForm.password}
              onChange={(e) =>
                setTeamForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Set a password"
              className={`${teamFieldClassName} pr-12`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('viewer')}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-indigo-600"
              aria-label={showPasswords.viewer ? 'Hide viewer password' : 'Show viewer password'}
            >
              {showPasswords.viewer ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm password
            </span>
            <div className="relative">
              <input
                type={showPasswords.viewerConfirm ? 'text' : 'password'}
                value={teamForm.confirmPassword}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm the password"
                className={`${teamFieldClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('viewerConfirm')}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-indigo-600"
                aria-label={showPasswords.viewerConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showPasswords.viewerConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => setShowCreateViewer(false)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateViewer}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Create viewer
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
