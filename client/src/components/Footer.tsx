import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, PhoneCall } from 'lucide-react';

const Footer: React.FC = () => {
  const location = useLocation();
  const hideOnAuth = location.pathname === '/login' || location.pathname === '/register';
  if (hideOnAuth) return null;

  return (
    <footer className="mt-10 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-600">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <p className="font-semibold text-slate-800">
              Provided by AdEMNEA Project
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Adaptive Environmental Monitoring Networks for East Africa
            </p>
            <p className="text-xs text-slate-500 mt-2">Fruitfly monitoring and diagnostics platform for smart agriculture.</p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
            >
              Dashboard
            </Link>
            <Link
              to="/map"
              className="px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
            >
              Map
            </Link>
            <Link
              to="/reports"
              className="px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
            >
              Reports
            </Link>
            <Link
              to="/gateways"
              className="px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
            >
              Gateways
            </Link>
            <Link
              to="/system-telemetry"
              className="px-3 py-1.5 rounded-full border border-emerald-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
            >
              Telemetry
            </Link>
          </div>

          <div className="text-xs space-y-2">
            <p className="font-semibold text-slate-800">Support & Contact</p>
            <a
              href="mailto:manager@trapiq.co.tz"
              className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-700"
            >
              <Mail size={14} />
              manager@trapiq.co.tz
            </a>
            <p className="inline-flex items-center gap-2 text-slate-500">
              <PhoneCall size={14} />
              AdEMNEA Coordination Desk
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-500">
          <span>© Copyright AdEMNEA. All Rights Reserved.</span>
          <span>AdEMNEA Agricultural Intelligence Platform</span>
          <span>Location: DIT, Tanzania</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
