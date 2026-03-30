import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  ImageIcon,
  Loader,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import api from '../api/Sapi';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/useAuth';
import { formatLocalDateTime } from '../utils/datetime';

interface FruitflyImageRow {
  id: number;
  sensor_name: string;
  sensor_serial_number: string;
  analysis_status: 'pending' | 'analyzed' | 'failed';
  analysis_notes: string | null;
  analyzed_at: string | null;
  fruitfly_count: number | null;
  image_url: string;
  time_captured: string | null;
  created_at: string;
}

interface SensorOption {
  id: number;
  name: string;
  serial_number: string;
}

interface StatusTab {
  key: 'all' | 'pending' | 'analyzed' | 'failed';
  label: string;
  value: number;
}

interface AnalysisModalProps {
  image: FruitflyImageRow | null;
  open: boolean;
  status: FruitflyImageRow['analysis_status'];
  notes: string;
  saving: boolean;
  onClose: () => void;
  onStatusChange: (value: FruitflyImageRow['analysis_status']) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
}

interface ImageViewerProps {
  image: FruitflyImageRow | null;
  canManage: boolean;
  deleting: boolean;
  onClose: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

const statusClassMap: Record<FruitflyImageRow['analysis_status'], string> = {
  pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  analyzed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  failed: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
};

const createDownloadName = (row: FruitflyImageRow) => {
  const safeSensor = row.sensor_serial_number.replace(/[^a-zA-Z0-9_-]/g, '-');
  const safeDate = (row.time_captured ?? row.created_at)
    .replace(/[:.]/g, '-')
    .replace(/\s+/g, '-');

  return `${safeSensor}-${safeDate}.png`;
};

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  image,
  open,
  status,
  notes,
  saving,
  onClose,
  onStatusChange,
  onNotesChange,
  onSave,
}) =>
  open && image ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid lg:grid-cols-[1fr_0.9fr]">
          <div className="border-b border-slate-100 bg-slate-100 lg:border-b-0 lg:border-r">
            <img
              src={image.image_url}
              alt={`Fruitfly capture ${image.id}`}
              className="h-full min-h-[280px] w-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Image review
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              Analyze image
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review the capture, set its analysis status, and leave notes for the team.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Analysis status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    onStatusChange(e.target.value as FruitflyImageRow['analysis_status'])
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="pending">Pending</option>
                  <option value="analyzed">Analyzed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Analysis notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={6}
                  placeholder="Add a short review note, confirm image quality, or explain why analysis failed."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sensor</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{image.sensor_name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Recorded count</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {image.fruitfly_count ?? 'Not linked'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader className="h-4 w-4 animate-spin" />}
                Save analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  canManage,
  deleting,
  onClose,
  onAnalyze,
  onDelete,
  onDownload,
}) =>
  image ? (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="grid h-full lg:grid-cols-[1.4fr_0.6fr]">
        <div className="flex items-center justify-center p-4 lg:p-8">
          <img
            src={image.image_url}
            alt={`Fruitfly capture ${image.id}`}
            className="max-h-full w-full rounded-[28px] object-contain shadow-2xl"
          />
        </div>

        <aside className="border-t border-white/10 bg-slate-950/90 p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
          <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            <span className={`rounded-full px-2.5 py-1 ${statusClassMap[image.analysis_status]}`}>
              {image.analysis_status}
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-semibold">{image.sensor_name}</h2>
          <p className="mt-1 text-sm text-slate-300">{image.sensor_serial_number}</p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Captured</p>
              <p className="mt-2 text-sm font-medium text-white">
                {formatLocalDateTime(image.time_captured ?? image.created_at)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Recorded count</p>
              <p className="mt-2 text-sm font-medium text-white">
                {image.fruitfly_count ?? 'Not linked'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Analysis notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {image.analysis_notes?.trim() || 'No analysis notes recorded yet.'}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={onDownload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Download className="h-4 w-4" />
              Download image
            </button>

            {canManage && (
              <button
                onClick={onAnalyze}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                Analyze image
              </button>
            )}

            {canManage && (
              <button
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete image
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  ) : null;

const FruitflyImages: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role !== 'viewer';
  const [rows, setRows] = useState<FruitflyImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [selectedSensorSerial, setSelectedSensorSerial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusTab['key']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [viewerImage, setViewerImage] = useState<FruitflyImageRow | null>(null);
  const [analysisImage, setAnalysisImage] = useState<FruitflyImageRow | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<FruitflyImageRow['analysis_status']>('pending');
  const [analysisNotes, setAnalysisNotes] = useState('');

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 120 };
      if (selectedSensorSerial !== 'all') {
        params.sensor_serial_number = selectedSensorSerial;
      }

      const { data } = await api.get('/device/fruitfly-images', { params });
      setRows(data.rows ?? []);
    } catch (error) {
      console.error('Failed to load fruitfly images', error);
      setMessage({ text: 'Failed to load images.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const { data } = await api.get('/sensors');
        setSensors(data ?? []);
      } catch (error) {
        console.error('Failed to load sensors for image filter', error);
      }
    };

    fetchSensors();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [selectedSensorSerial]);

  const totals = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.analysis_status === 'pending').length,
      analyzed: rows.filter((row) => row.analysis_status === 'analyzed').length,
      failed: rows.filter((row) => row.analysis_status === 'failed').length,
    }),
    [rows]
  );

  const statusTabs: StatusTab[] = useMemo(
    () => [
      { key: 'all', label: 'All', value: totals.total },
      { key: 'pending', label: 'Pending', value: totals.pending },
      { key: 'analyzed', label: 'Analyzed', value: totals.analyzed },
      { key: 'failed', label: 'Failed', value: totals.failed },
    ],
    [totals]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus =
        selectedStatus === 'all' ? true : row.analysis_status === selectedStatus;

      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [
              row.sensor_name,
              row.sensor_serial_number,
              row.analysis_notes ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [rows, searchTerm, selectedStatus]);

  const openAnalysisModal = (image: FruitflyImageRow) => {
    setAnalysisImage(image);
    setAnalysisStatus(image.analysis_status);
    setAnalysisNotes(image.analysis_notes ?? '');
  };

  const closeAnalysisModal = () => {
    setAnalysisImage(null);
    setAnalysisStatus('pending');
    setAnalysisNotes('');
  };

  const handleAnalyzeImage = async () => {
    if (!analysisImage) return;

    try {
      setActionLoadingId(analysisImage.id);
      await api.patch(`/device/fruitfly-images/${analysisImage.id}/analyze`, {
        analysis_status: analysisStatus,
        analysis_notes: analysisNotes,
      });

      const updatedAt =
        analysisStatus === 'pending' ? null : new Date().toISOString();

      setRows((prev) =>
        prev.map((row) =>
          row.id === analysisImage.id
            ? {
                ...row,
                analysis_status: analysisStatus,
                analysis_notes: analysisNotes.trim() || null,
                analyzed_at: updatedAt,
              }
            : row
        )
      );

      setViewerImage((prev) =>
        prev && prev.id === analysisImage.id
          ? {
              ...prev,
              analysis_status: analysisStatus,
              analysis_notes: analysisNotes.trim() || null,
              analyzed_at: updatedAt,
            }
          : prev
      );

      setMessage({ text: 'Image analysis updated.', ok: true });
      closeAnalysisModal();
    } catch (error) {
      console.error('Failed to update image analysis', error);
      setMessage({ text: 'Failed to update image analysis.', ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteImage = async (image: FruitflyImageRow) => {
    const confirmed = window.confirm('Delete this image permanently?');
    if (!confirmed) return;

    try {
      setActionLoadingId(image.id);
      await api.delete(`/device/fruitfly-images/${image.id}`);
      setRows((prev) => prev.filter((row) => row.id !== image.id));
      setViewerImage((prev) => (prev?.id === image.id ? null : prev));
      setAnalysisImage((prev) => (prev?.id === image.id ? null : prev));
      setMessage({ text: 'Image deleted.', ok: true });
    } catch (error) {
      console.error('Failed to delete image', error);
      setMessage({ text: 'Failed to delete image.', ok: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadImage = (row: FruitflyImageRow) => {
    const link = document.createElement('a');
    link.href = row.image_url;
    link.download = createDownloadName(row);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <BackButton className="mb-4 border-white/15 bg-white/10 text-white hover:border-white/20 hover:bg-white/15 hover:text-white" />
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                <Camera className="h-3.5 w-3.5" />
                Image review
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Fruitfly image analysis
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Review captures, analyze pending images, remove unwanted files, and open each image in a cleaner full-screen viewer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Images</p>
                <p className="mt-2 text-3xl font-semibold">{totals.total}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Pending</p>
                <p className="mt-2 text-3xl font-semibold text-amber-300">{totals.pending}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Analyzed</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{totals.analyzed}</p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 shadow-sm ${
              message.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <div>
              <p className="text-sm font-semibold">
                {message.ok ? 'Action completed' : 'Action failed'}
              </p>
              <p className="mt-1 text-sm">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="rounded-full p-1 text-current/70 transition hover:bg-white/60 hover:text-current"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-3">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selectedStatus === tab.key
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {tab.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{tab.value}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sensor or notes..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:w-64"
                />
              </label>

              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedSensorSerial}
                  onChange={(e) => setSelectedSensorSerial(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:w-72"
                >
                  <option value="all">All sensors</option>
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.serial_number}>
                      {sensor.name} ({sensor.serial_number})
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={fetchImages}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            Loading images...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">No images found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try another sensor, change the status tab, or clear your search.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRows.map((row) => (
              <article
                key={row.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setViewerImage(row)}
                  className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"
                >
                  <img
                    src={row.image_url}
                    alt={`Fruitfly capture ${row.id}`}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                    loading="lazy"
                  />
                </button>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Camera className="h-4 w-4 text-indigo-600" />
                        <span className="truncate">{row.sensor_name}</span>
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {row.sensor_serial_number}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClassMap[row.analysis_status]}`}
                    >
                      {row.analysis_status}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Captured
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {formatLocalDateTime(row.time_captured ?? row.created_at)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Count
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {row.fruitfly_count ?? 'Not linked'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 min-h-[3rem] overflow-hidden text-sm leading-6 text-slate-600">
                      {row.analysis_notes?.trim() || 'No analysis notes yet.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setViewerImage(row)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadImage(row)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openAnalysisModal(row)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Analyze
                      </button>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(row)}
                        disabled={actionLoadingId === row.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoadingId === row.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <AnalysisModal
        image={analysisImage}
        open={Boolean(analysisImage)}
        status={analysisStatus}
        notes={analysisNotes}
        saving={actionLoadingId === analysisImage?.id}
        onClose={closeAnalysisModal}
        onStatusChange={setAnalysisStatus}
        onNotesChange={setAnalysisNotes}
        onSave={handleAnalyzeImage}
      />

      <ImageViewer
        image={viewerImage}
        canManage={canManage}
        deleting={actionLoadingId === viewerImage?.id}
        onClose={() => setViewerImage(null)}
        onAnalyze={() => {
          if (!viewerImage) return;
          openAnalysisModal(viewerImage);
        }}
        onDelete={() => {
          if (!viewerImage) return;
          handleDeleteImage(viewerImage);
        }}
        onDownload={() => {
          if (!viewerImage) return;
          handleDownloadImage(viewerImage);
        }}
      />
    </div>
  );
};

export default FruitflyImages;
