import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();
  const hideOnAuth = location.pathname === '/login' || location.pathname === '/register';
  if (hideOnAuth) return null;

  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700">
              Provided by AdEMNEA Project
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Adaptive Environmental Monitoring Networks for East Africa
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Dashboard
            </Link>
            <Link
              to="/map"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Location
            </Link>
            <Link
              to="/reports"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Reports
            </Link>
            <Link
              to="/gateways"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Gateways
            </Link>
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Profile
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
          <span>© Copyright AdEMNEA. All Rights Reserved.</span>
          <span>AdEMNEA Corporate</span>
          <span>Location: DIT, Tanzania.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
