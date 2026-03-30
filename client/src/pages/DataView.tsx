import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, ChevronRight, Database, MapPin, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/Sapi';
import BackButton from '../components/BackButton';
import { formatLocalDate } from '../utils/datetime';

interface Gateway {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  created_at: string;
}

const getStatusClassName = (status: Gateway['status']) => {
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

const DataView: React.FC = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const { data } = await api.get('/gateways');
        setGateways(data);
      } catch (error) {
        console.error('Failed to load gateways for data view', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGateways();
  }, []);

  const onlineCount = useMemo(
    () => gateways.filter((gateway) => gateway.status === 'online').length,
    [gateways]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <BackButton />
        </div>

        <section className="overflow-hidden rounded-[32px] border border-emerald-950/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(135deg,#10231c_0%,#173227_55%,#0f1e18_100%)] px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
                <Database className="h-3.5 w-3.5" />
                Sensors access
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Open the existing sensors view directly
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                This page gives you direct access to monitoring records from the navbar without first opening the dashboard or gateway cards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/75">Gateways</p>
                <p className="mt-3 text-3xl font-semibold">{gateways.length}</p>
                <p className="mt-1 text-xs text-emerald-50/75">Available data sources</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/75">Online</p>
                <p className="mt-3 text-3xl font-semibold">{onlineCount}</p>
                <p className="mt-1 text-xs text-emerald-50/75">Ready for monitoring</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Gateway data access</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a gateway below to open its sensor monitoring page with environmental, fruitfly, and activity records.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              <Activity className="h-4 w-4" />
              Direct monitoring access
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Loading gateway data access...
            </div>
          ) : gateways.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No gateways available yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Add a gateway first, then its monitoring data will be available here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gateways.map((gateway) => (
                <button
                  key={gateway.id}
                  type="button"
                  onClick={() => navigate(`/gateways/${gateway.id}/sensors`)}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                      <Wifi className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(gateway.status)}`}
                    >
                      {gateway.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{gateway.name}</h3>
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {gateway.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Added {formatLocalDate(gateway.created_at)}
                    </p>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    Open sensors view
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DataView;
