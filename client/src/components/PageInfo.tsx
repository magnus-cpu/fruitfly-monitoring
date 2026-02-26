import React, { useState } from 'react';
import { ChevronDown, Lightbulb, Sparkles, Target } from 'lucide-react';

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

  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
  const cardBlocks = sorted.filter((b) => b.style === 'card');
  const accordionBlocks = sorted.filter((b) => b.style === 'accordion');
  const featuredCard = cardBlocks[0];
  const secondaryCards = cardBlocks.slice(1);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/60 to-lime-50/80 p-6 md:p-8 shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.10),rgba(132,204,22,0.08),rgba(59,130,246,0.08),rgba(16,185,129,0.10))] bg-[length:240%_240%] animate-[pageinfoShift_12s_ease-in-out_infinite]" />
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-lime-300/30 blur-3xl animate-[pageinfoPulse_8s_ease-in-out_infinite]" />
      <div className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl animate-[pageinfoPulse_10s_ease-in-out_infinite]" />
      <div className="relative z-10 flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Field Insights</p>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <Sparkles size={14} />
          Live Guidance
        </span>
      </div>
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 space-y-4">
          {featuredCard ? (
            <article className="rounded-2xl border border-emerald-200 bg-white/90 p-5 md:p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Lightbulb size={13} />
                Spotlight
              </div>
              <h4 className="text-lg md:text-xl font-bold text-slate-900 mt-3">{featuredCard.title}</h4>
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-line leading-relaxed">{featuredCard.body}</p>
            </article>
          ) : null}

          {secondaryCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryCards.map((block) => (
                <article key={block.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    <Target size={12} />
                    Key Note
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mt-2">{block.title}</h4>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">{block.body}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="xl:col-span-5 space-y-3">
          {accordionBlocks.map((block, idx) => {
            const isOpen = openIds[block.id] ?? idx === 0;

            return (
              <article key={block.id} className="rounded-2xl border border-slate-200 bg-white/85 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenIds((prev) => ({ ...prev, [block.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-emerald-50/60 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{block.title}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {block.body}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes pageinfoShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pageinfoPulse {
          0% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.08); opacity: 0.65; }
          100% { transform: scale(1); opacity: 0.45; }
        }
      `}</style>
    </section>
  );
};
