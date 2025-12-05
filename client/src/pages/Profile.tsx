import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Mail, Calendar, MapPin, Trash2, Edit3,
  AlertTriangle, X, Loader, Activity
} from 'lucide-react';
import type { FieldProps, ModalProps, ProfileProps } from '../types/profileTypes';

interface Sensor {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const Profile: React.FC = () => {
  const {logout } = useAuth();
  const [profile, setProfile] = useState<ProfileProps | null>(null);
  const nav = useNavigate();

  /* ---- modals ---- */
  const [showUpdate, setShowUpdate] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  /* ---- form ---- */
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  /* ---- devices ---- */
  const [sensors, setSensors] = useState<Sensor[]>([]);

  /* ---- initial data ---- */
  useEffect(() => {

    setForm({ username: profile?.username || '', email: profile?.email || '', password: '', newPassword: '' });
    const fetchData = async () => {
      /* 1.  own profile (extra safety – in case context is stale) */
      const data = await axios.get('http://localhost:5000/api/users/profile');
      setProfile(data.data);

      /* 2.  all sensors – filter client-side by user.id */
        const response = await axios.get('http://localhost:5000/api/sensors');
      setSensors(response.data);
    };
    fetchData();
  }, [profile?.username, profile?.email]);

  /* ---- handlers ---- */
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put('http://localhost:5000/api/users/profile', {
        username: form.username,
        email: form.email,
      });
      if (profile) setProfile(data);
      setMsg({ text: 'Profile updated 🎉', ok: true });
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
      await axios.put('http://localhost:5000/api/users/profile/change-password', {
        password: form.password,
        newPassword: form.newPassword,
      });
      setMsg({ text: 'Password changed', ok: true });
      setShowPass(false);
      setForm({ ...form, password: '', newPassword: '' });
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
      await axios.delete('http://localhost:5000/api/users/profile');
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

  /* ---- ui helpers ---- */
 const Field: React.FC<FieldProps> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);

  const Modal: React.FC<ModalProps> = ({ children, open, setOpen }) =>
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          {children}
        </div>
      </div>
    ) : null;

    if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* ---- header ---- */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-lg text-white p-8 flex items-center space-x-6">
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <User className="w-16 h-16" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile?.username}</h1>
            <p className="flex items-center space-x-2 mt-1 opacity-90">
              <Mail className="w-4 h-4" />
              <span>{profile?.email}</span>
            </p>
            <p className="flex items-center space-x-2 mt-1 opacity-90">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile?.created_at).toDateString()}</span>
            </p>
          </div>
        </div>

        {/* ---- flash ---- */}
        {msg && (
          <div
            className={`mt-4 flex items-center justify-between px-4 py-2 rounded-lg text-white ${
              msg.ok ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---- actions ---- */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setShowUpdate(true)}
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-lg p-4 hover:shadow transition"
          >
            <Edit3 className="w-5 h-5 text-green-600" />
            <span>Update profile</span>
          </button>
          <button
            onClick={() => setShowPass(true)}
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-lg p-4 hover:shadow transition"
          >
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Change password</span>
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center justify-center space-x-2 bg-white border border-red-300 rounded-lg p-4 hover:shadow transition text-red-600"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete account</span>
          </button>
        </div>

        {/* ---- devices ---- */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">My Devices ({sensors.length})</h2>
          {sensors.length === 0 ? (
            <p className="text-gray-500">No devices registered yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensors.map((s) => (
                <div key={s.id} className="border rounded-lg p-4 hover:shadow transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{s.location}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Added {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- modals ---------- */}

      {/* update */}
      <Modal open={showUpdate} setOpen={setShowUpdate}>
        <h3 className="text-lg font-semibold mb-4">Update profile</h3>
        <div className="space-y-3">
          <Field label="Username" name="username" value={form.username} />
          <Field label="Email" name="email" type="email" value={form.email} />
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-60"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <span>Save</span>
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* password */}
      <Modal open={showPass} setOpen={setShowPass}>
        <h3 className="text-lg font-semibold mb-4">Change password</h3>
        <div className="space-y-3">
          <Field label="Current password" name="password" type="password" value={form.password} />
          <Field label="New password" name="newPassword" type="password" value={form.newPassword} />
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleChangePass}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-60"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <span>Update</span>
          </button>
          <button
            onClick={() => setShowPass(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* delete */}
      <Modal open={showDelete} setOpen={setShowDelete}>
        <div className="flex items-center space-x-3 text-red-600">
          <AlertTriangle className="w-10 h-10" />
          <div>
            <h3 className="text-lg font-semibold">Delete account</h3>
            <p className="text-sm text-gray-600">
              This action is irreversible. All your devices and data will be removed.
            </p>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <span>Confirm deletion</span>
          </button>
          <button
            onClick={() => setShowDelete(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;