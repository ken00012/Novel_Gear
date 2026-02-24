import { Plus } from 'lucide-react';
import { type Plot, type Event } from '../../../api';
import PlotCard from './PlotCard';

interface PlotColumnProps {
    phase: { id: string; label: string; color: string; borderColor: string; };
    plots: Plot[];
    events: Event[];
    onEdit: (plot: Plot) => void;
    onCreate: () => void;
    onDelete: (id: number) => void;
}

export default function PlotColumn({ phase, plots, events, onEdit, onCreate, onDelete }: PlotColumnProps) {
    return (
        <div className={`w-80 flex flex-col rounded-xl border ${phase.borderColor} ${phase.color}`}>
            <div className="p-4 border-b border-black/5 font-bold text-gray-800 shrink-0 flex justify-between items-center">
                <span>{phase.label}</span>
                <span className="text-xs bg-white/60 px-2 py-1 rounded-full text-gray-600">{plots.length}</span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                {plots.map(plot => (
                    <PlotCard
                        key={plot.id}
                        plot={plot}
                        event={events.find(e => e.id === plot.event_id)}
                        onEdit={() => onEdit(plot)}
                        onDelete={() => onDelete(plot.id)}
                    />
                ))}

                <button
                    onClick={onCreate}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white/50 transition"
                >
                    <Plus size={16} />
                    追加
                </button>
            </div>
        </div>
    );
}
