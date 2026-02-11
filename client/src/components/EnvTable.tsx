import { ChevronRight } from "lucide-react";
import type { Environmental } from "../types/sensorTypes";

export const EnvTable = ({ envData }: { envData: Environmental[] }) => {
    const sortedEnvData = [...envData]
        .sort(
            (a, b) =>
                new Date(b.time_taken).getTime() -
                new Date(a.time_taken).getTime()
        )
        .slice(0, 10);

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Sequence</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Reading</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Trend</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {sortedEnvData.map((log, idx) => {
                    const prev = sortedEnvData[idx + 1];
                    const currTemp = Number(log.temperature);
                    const prevTemp = prev ? Number(prev.temperature) : currTemp;
                    const diff = +(currTemp - prevTemp).toFixed(1);

                    return (
                        <tr key={log.id} className="hover:bg-slate-100/50 transition-colors group">
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                        {new Date(log.time_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {new Date(log.time_taken).toLocaleDateString()}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-slate-400 font-bold mb-0.5">TEMP</span>
                                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{log.temperature}°</span>
                                    </div>
                                    <div className="flex flex-col items-center border-l border-slate-300 pl-4">
                                        <span className="text-xs text-slate-400 font-bold mb-0.5">HUM</span>
                                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{log.humidity}%</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-right">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${diff > 0 ? 'text-orange-600 bg-orange-50' :
                                    diff < 0 ? 'text-blue-600 bg-blue-50' :
                                        'text-slate-400 bg-slate-100'
                                    }`}>
                                    {diff > 0 ? <ChevronRight size={12} className="-rotate-90" /> : diff < 0 ? <ChevronRight size={12} className="rotate-90" /> : null}
                                    {diff === 0 ? 'STABLE' : `${Math.abs(diff)}°`}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

    );
};

