import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, PhoneCall } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 min-h-[220px]">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10 text-sm text-slate-600 h-full flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          <div className="space-y-2">
            <p className="font-semibold text-slate-800">
              Provided by AdEMNEA Project
            </p>
            <p className="text-xs text-slate-500">
              Adaptive Environmental Monitoring Networks for East Africa
            </p>
            <p className="text-xs text-slate-500">Fruitfly monitoring and diagnostics platform for smart agriculture.</p>
          </div>

          <div className="flex flex-wrap gap-2.5 text-xs content-start">
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

          <div className="text-xs space-y-2 md:justify-self-end">
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

        <div className="mt-7 pt-4 border-t border-emerald-200/70 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-500">
          <span>© Copyright AdEMNEA. All Rights Reserved.</span>
          <span>AdEMNEA Agricultural Intelligence Platform</span>
          <span>Location: DIT, Tanzania</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
