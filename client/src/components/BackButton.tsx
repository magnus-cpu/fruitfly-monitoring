import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors ${className}`}
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
};

export default BackButton;
