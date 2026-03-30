import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ClipboardList, Trash2, RefreshCw } from 'lucide-react';
import api from '../api/Sapi';
import { useAuth } from '../contexts/useAuth';
import BackButton from '../components/BackButton';
import { formatLocalDateTime } from '../utils/datetime';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  manager_user_id: number | null;
  created_at: string;
}

interface AuditLog {
  id: number;
  actor_user_id: number | null;
  actor_username: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      const { data } = await api.get('/users');
      setUsers(data.users ?? []);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setMessage({ ok: false, text: 'Failed to load users' });
    } finally {
      setUserLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogLoading(true);
      const { data } = await api.get('/audit-logs', {
        params: {
          limit: 50,
          search: search || undefined,
          entity_type: entityType || undefined
        }
      });
      setLogs(data.rows ?? []);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      setMessage({ ok: false, text: 'Failed to load audit logs' });
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchUsers();
    fetchLogs();
  }, [user?.role]);

  const handleRoleUpdate = async (targetUser: AdminUser, role: 'admin' | 'manager') => {
    try {
      await api.patch(`/users/${targetUser.id}/role`, { role });
      setUsers((prev) => prev.map((item) => item.id === targetUser.id ? { ...item, role } : item));
      setMessage({ ok: true, text: `Updated ${targetUser.username} to ${role}` });
      fetchLogs();
    } catch (error) {
      console.error('Failed to update user role', error);
      setMessage({ ok: false, text: 'Failed to update role' });
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (!window.confirm(`Delete account for ${targetUser.username}?`)) return;

    try {
      await api.delete(`/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      setMessage({ ok: true, text: `Deleted ${targetUser.username}` });
      fetchLogs();
    } catch (error) {
      console.error('Failed to delete user', error);
      setMessage({ ok: false, text: 'Failed to delete user' });
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!window.confirm('Delete this audit log entry?')) return;

    try {
      await api.delete(`/audit-logs/${logId}`);
      setLogs((prev) => prev.filter((log) => log.id !== logId));
      setMessage({ ok: true, text: 'Audit log deleted' });
    } catch (error) {
      console.error('Failed to delete audit log', error);
      setMessage({ ok: false, text: 'Failed to delete audit log' });
    }
  };

  const handleClearLogs = async (beforeDays?: number) => {
    const label = beforeDays ? `Clear logs older than ${beforeDays} days?` : 'Clear all audit logs?';
    if (!window.confirm(label)) return;

    try {
      await api.delete('/audit-logs', {
        params: beforeDays ? { before_days: beforeDays } : undefined
      });
      setMessage({ ok: true, text: beforeDays ? 'Old audit logs cleared' : 'All audit logs cleared' });
      fetchLogs();
    } catch (error) {
      console.error('Failed to clear audit logs', error);
      setMessage({ ok: false, text: 'Failed to clear audit logs' });
    }
  };

  const stats = useMemo(
    () => ({
      users: users.length,
      admins: users.filter((entry) => entry.role === 'admin').length,
      managers: users.filter((entry) => entry.role === 'manager').length,
      viewers: users.filter((entry) => entry.role === 'viewer').length,
      logs: logs.length
    }),
    [users, logs]
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-6">
          <BackButton className="mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">Admin Access Required</h1>
          <p className="text-slate-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <BackButton className="mb-3" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage users, roles, content, and audit activity.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/content"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Open Content Manager
            </Link>
            <button
              onClick={() => {
                fetchUsers();
                fetchLogs();
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-indigo-400"
            >
              Refresh
            </button>
          </div>
        </header>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {message.text}
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Users</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.users}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Admins</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.admins}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Managers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.managers}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Viewers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.viewers}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Recent Logs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.logs}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 inline-flex items-center gap-2">
                <Users size={18} />
                User Management
              </h2>
              <p className="text-sm text-slate-500 mt-1">Review accounts, adjust roles, and remove users when necessary.</p>
            </div>
          </div>

          {userLoading ? (
            <div className="text-slate-500">Loading users...</div>
          ) : (
            <div className="space-y-3">
              {users.map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{entry.username}</div>
                    <div className="text-sm text-slate-500">{entry.email}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Role: {entry.role} | Created {formatLocalDateTime(entry.created_at)}
                      {entry.manager_user_id ? ` | Manager ID: ${entry.manager_user_id}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.role !== 'viewer' && (
                      <select
                        value={entry.role}
                        onChange={(e) => handleRoleUpdate(entry, e.target.value as 'admin' | 'manager')}
                        disabled={entry.id === user.id}
                        className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                      >
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleDeleteUser(entry)}
                      disabled={entry.id === user.id}
                      className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 inline-flex items-center gap-2">
                <ClipboardList size={18} />
                Audit Logs
              </h2>
              <p className="text-sm text-slate-500 mt-1">Track login history and other recorded system activities.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs"
                className="px-3 py-2 border border-slate-200 rounded-lg"
              />
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">All Entities</option>
                <option value="auth">Auth</option>
                <option value="user">User</option>
                <option value="gateway">Gateway</option>
                <option value="sensor">Sensor</option>
                <option value="report">Report</option>
                <option value="content_block">Content</option>
              </select>
              <button
                onClick={fetchLogs}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-indigo-400 inline-flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Apply
              </button>
              <button
                onClick={() => handleClearLogs(30)}
                className="px-3 py-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Clear 30d+
              </button>
              <button
                onClick={() => handleClearLogs()}
                className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {logLoading ? (
            <div className="text-slate-500">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500">No audit logs found.</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 inline-flex items-center gap-2">
                        <Shield size={14} />
                        {log.action}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Actor: {log.actor_username ?? 'Unknown'} {log.actor_email ? `(${log.actor_email})` : ''}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Entity: {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''} | {formatLocalDateTime(log.created_at)}
                      </div>
                      {log.details && (
                        <pre className="mt-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
