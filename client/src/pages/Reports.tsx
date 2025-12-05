import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import axios from 'axios';
import { Download, Calendar, FileText, TrendingUp } from 'lucide-react';

interface Report {
  id: number;
  report_type: string;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
  file_path?: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
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
      // const response = await axios.post('http://localhost:5000/api/reports', {
      //   report_type: reportType,
      //   date_range_start: startDate,
      //   date_range_end: endDate,
      // });
      const response = await axios.post('http://localhost:5000/api/reports');
      const parsed = response.data.map((r: Report) => ({
        ...r,
        report_type: String(r.report_type),
        date_range_start: String(r.date_range_start),
        date_range_end: String(r.date_range_end)

      }));
      setReports(parsed);

      // Simulate report generation
      setTimeout(() => {
        const newReport: Report = {
          id: Date.now(),
          report_type: reportType,
          date_range_start: startDate,
          date_range_end: endDate,
          created_at: new Date().toISOString(),
          file_path: `report_${Date.now()}.pdf`,
        };
        setReports([newReport, ...reports]);
        setGenerating(false);
        alert('Report generated successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error generating report:', error);
      setGenerating(false);
      alert('Failed to generate report');
    }
  };

  const downloadReport = (report: Report) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `fruitfly_report_${report.id}.pdf`;
    link.click();
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
                <option value="sensor">Sensor Data Report</option>
                <option value="alert">Alert History Report</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
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
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(report.date_range_start).toLocaleDateString()} -{' '}
                      {new Date(report.date_range_end).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Generated on {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;