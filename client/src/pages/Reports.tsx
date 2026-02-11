import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Download, Calendar, FileText, TrendingUp } from 'lucide-react';
import api from '../api/Sapi';
import { PageInfo, type ContentBlock } from '../components/PageInfo';

interface Report {
  id: number;
  report_type: string;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
  file_path?: string;
}

const Reports: React.FC = () => {
  useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availability, setAvailability] = useState<{ min: string | null; max: string | null }>({
    min: null,
    max: null
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    fetchReports();
    fetchAvailability();
    api.get('/content', { params: { page: 'reports' } })
      .then((res) => setContentBlocks(res.data))
      .catch((err) => console.error('Failed to load reports info', err));
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/reports/availability');
      setAvailability({
        min: response.data?.min_date ?? null,
        max: response.data?.max_date ?? null
      });
    } catch (error) {
      console.error('Error fetching report availability:', error);
    }
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      setGenerating(true);
      const response = await api.post('/reports', {
        report_type: reportType,
        date_range_start: startDate,
        date_range_end: endDate
      });

      const newReport: Report = {
        id: response.data.id,
        report_type: reportType,
        date_range_start: startDate,
        date_range_end: endDate,
        created_at: new Date().toISOString(),
        file_path: response.data.file_path
      };

      setReports((prev) => [newReport, ...prev]);
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      setGenerating(false);
      alert('Failed to generate report');
      return;
    }
    setGenerating(false);
  };

  const downloadReport = async (report: Report, format: 'json' | 'csv' | 'pdf') => {
    try {
      const response = await api.get(`/reports/${report.id}/download`, {
        params: { format },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : format === 'csv'
              ? 'text/csv'
              : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fruitfly_report_${report.id}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>

      {/* Generate New Report */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="mr-2" />
          Generate New Report
        </h2>
        <form onSubmit={generateReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="summary">Summary Report</option>
                <option value="analytics">Analytics Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={availability.min ? availability.min.slice(0, 10) : undefined}
                max={availability.max ? availability.max.slice(0, 10) : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={availability.min ? availability.min.slice(0, 10) : undefined}
                max={availability.max ? availability.max.slice(0, 10) : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {availability.min && availability.max ? (
            <div className="mt-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <div className="font-semibold">Available data</div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white px-2 py-0.5 font-semibold text-blue-800">
                {new Date(availability.min).toLocaleDateString()}
                <span className="text-blue-400">→</span>
                {new Date(availability.max).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              No sensor data available yet. Reports will be empty until readings are collected.
            </div>
          )}
          <button
            type="submit"
            disabled={generating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </form>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Generated Reports</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No reports generated yet. Create your first report above!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {getReportIcon(report.report_type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {report.report_type.replace('_', ' ')} Report
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="font-medium">Range</span>
                      </div>
                      <div className="ml-5">
                        {new Date(report.date_range_start).toLocaleDateString()} -{' '}
                        {new Date(report.date_range_end).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Generated on {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadReport(report, 'pdf')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </button>
                  <button
                    onClick={() => downloadReport(report, 'csv')}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-md flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <PageInfo title="Reports Guidance" blocks={contentBlocks} />
      </div>
    </div>
  );
};

export default Reports;
