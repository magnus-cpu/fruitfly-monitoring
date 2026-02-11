import React, { useState } from 'react';

export interface ContentBlock {
  id: number;
  page_key: string;
  section_key: string;
  title: string;
  body: string;
  style: 'card' | 'accordion';
  order_index: number;
}

export const PageInfo: React.FC<{
  title?: string;
  blocks: ContentBlock[];
}> = ({ title = 'Guidance', blocks }) => {
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({});

  if (!blocks.length) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 md:p-8 shadow-sm">
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Insights</p>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
      </div>
      <div className="relative z-10 space-y-4">
        {blocks.map((block) => {
          if (block.style === 'accordion') {
            const isOpen = openIds[block.id] ?? false;
            return (
              <div key={block.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setOpenIds((prev) => ({ ...prev, [block.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/70 hover:bg-white transition-colors"
                >
                  <span className="font-semibold text-slate-900">{block.title}</span>
                  <span className="text-xs text-slate-500">{isOpen ? 'Collapse' : 'Expand'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 whitespace-pre-line">
                    {block.body}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={block.id} className="border border-slate-200 rounded-2xl p-5 bg-white/80 backdrop-blur">
              <h4 className="text-base font-semibold text-slate-900">{block.title}</h4>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{block.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
