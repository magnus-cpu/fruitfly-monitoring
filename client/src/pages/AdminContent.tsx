import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/Sapi';
import { useAuth } from '../contexts/useAuth';

interface ContentBlock {
  id: number;
  page_key: string;
  section_key: string;
  title: string;
  body: string;
  style: 'card' | 'accordion';
  order_index: number;
}

const AdminContent: React.FC = () => {
  const { user } = useAuth();
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    page_key: 'dashboard',
    section_key: '',
    title: '',
    body: '',
    style: 'card',
    order_index: 0
  });
  const [filterPage, setFilterPage] = useState<'all' | 'dashboard' | 'reports' | 'sensors' | 'gateways'>('all');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fetchContent = async () => {
      try {
        const res = await api.get('/content');
        setContentBlocks(res.data);
      } catch (error) {
        console.error('Failed to fetch content blocks', error);
      }
    };
    fetchContent();
  }, [user?.role]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/content', {
        ...form,
        order_index: Number(form.order_index) || 0
      });
      const res = await api.get('/content');
      setContentBlocks(res.data);
      setForm({
        page_key: 'dashboard',
        section_key: '',
        title: '',
        body: '',
        style: 'card',
        order_index: 0
      });
    } catch (error) {
      console.error('Failed to save content block', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (block: ContentBlock) => {
    setForm({
      page_key: block.page_key,
      section_key: block.section_key,
      title: block.title,
      body: block.body,
      style: block.style,
      order_index: block.order_index
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this content block?')) return;
    try {
      await api.delete(`/content/${id}`);
      setContentBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Failed to delete content block', error);
    }
  };

  const grouped = useMemo(() => {
    const source = filterPage === 'all'
      ? contentBlocks
      : contentBlocks.filter((b) => b.page_key === filterPage);
    return source.reduce<Record<string, ContentBlock[]>>((acc, block) => {
      if (!acc[block.page_key]) acc[block.page_key] = [];
      acc[block.page_key].push(block);
      return acc;
    }, {});
  }, [contentBlocks, filterPage]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-6">
          <h1 className="text-xl font-semibold text-slate-900">Admin Access Required</h1>
          <p className="text-slate-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Content Manager</h1>
          <p className="text-slate-500 mt-1">Edit guidance text shown on dashboard, reports, sensors, and gateways.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Add / Update Block</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                <select
                  value={form.page_key}
                  onChange={(e) => setForm({ ...form, page_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="reports">Reports</option>
                  <option value="sensors">Sensors</option>
                  <option value="gateways">Gateways</option>
                </select>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Key</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={form.section_key}
                    onChange={(e) => setForm({ ...form, section_key: e.target.value })}
                    placeholder="e.g. control_measures"
                  />
                  <p className="text-xs text-slate-400 mt-1">Unique key per page. Used for updates.</p>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[140px]"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="card">Card</option>
                    <option value="accordion">Accordion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Existing Blocks</h2>
              <select
                value={filterPage}
                onChange={(e) => setFilterPage(e.target.value as typeof filterPage)}
                className="text-sm px-2 py-1.5 border border-slate-200 rounded-lg"
              >
                <option value="all">All Pages</option>
                <option value="dashboard">Dashboard</option>
                <option value="reports">Reports</option>
                <option value="sensors">Sensors</option>
                <option value="gateways">Gateways</option>
              </select>
            </div>
            {contentBlocks.length === 0 ? (
              <p className="text-sm text-gray-500">No content blocks yet.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {Object.entries(grouped).map(([page, blocks]) => (
                  <div key={page} className="border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-bold uppercase text-slate-400 mb-2">{page}</div>
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div key={block.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800">{block.title}</div>
                              <div className="text-xs text-gray-500">{block.section_key}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(block)}
                                className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(block.id)}
                                className="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 whitespace-pre-line">{block.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
