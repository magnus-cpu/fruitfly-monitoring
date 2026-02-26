import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, PhoneCall } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const Footer: React.FC = () => {
  const { user, loading } = useAuth();
  const showProtectedLinks = Boolean(user) && !loading;

  return (
    <footer className="border-t border-emerald-300/70 bg-gradient-to-r from-emerald-100 via-lime-50 to-amber-100 min-h-[220px]">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10 text-sm text-slate-700 h-full flex flex-col justify-between">
        <div className={`grid grid-cols-1 md:grid-cols-2 ${showProtectedLinks ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 md:gap-8 items-start`}>
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">
              Powered by the AdEMNEA Project
            </p>
            <p className="text-xs text-slate-600">
              Adaptive Environmental Monitoring Networks for East Africa
            </p>
            <p className="text-xs text-slate-600">
              Smart fruit fly surveillance and diagnostics for climate-resilient agriculture.
            </p>
          </div>

          {showProtectedLinks && (
            <div className="flex flex-wrap gap-2.5 text-xs content-start">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-full border border-emerald-300 bg-white/90 text-slate-800 hover:text-emerald-800 hover:border-emerald-500"
              >
                Dashboard
              </Link>
              <Link
                to="/map"
                className="px-3 py-1.5 rounded-full border border-emerald-300 bg-white/90 text-slate-800 hover:text-emerald-800 hover:border-emerald-500"
              >
                Map
              </Link>
              <Link
                to="/reports"
                className="px-3 py-1.5 rounded-full border border-emerald-300 bg-white/90 text-slate-800 hover:text-emerald-800 hover:border-emerald-500"
              >
                Reports
              </Link>
              <Link
                to="/gateways"
                className="px-3 py-1.5 rounded-full border border-emerald-300 bg-white/90 text-slate-800 hover:text-emerald-800 hover:border-emerald-500"
              >
                Gateways
              </Link>
              <Link
                to="/system-telemetry"
                className="px-3 py-1.5 rounded-full border border-emerald-300 bg-white/90 text-slate-800 hover:text-emerald-800 hover:border-emerald-500"
              >
                Telemetry
              </Link>
            </div>
          )}

          <div className="text-xs space-y-2 md:justify-self-end">
            <p className="font-semibold text-slate-900">Support & Contact</p>
            <a
              href="mailto:manager@trapiq.co.tz"
              className="inline-flex items-center gap-2 text-slate-800 hover:text-emerald-800"
            >
              <Mail size={14} />
              manager@trapiq.co.tz
            </a>
            <p className="inline-flex items-center gap-2 text-slate-600">
              <PhoneCall size={14} />
              AdEMNEA Coordination Desk
            </p>
          </div>
        </div>

        <div className="mt-7 pt-4 border-t border-emerald-300/70 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-600">
          <span>© AdEMNEA. All rights reserved.</span>
          <span>Agricultural Intelligence Platform</span>
          <span>DIT Innovation Hub, Tanzania</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
