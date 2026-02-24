import { type Plot, type Event } from '../../../api';
import PlotColumn from './PlotColumn';

interface PlotBoardProps {
    plots: Plot[];
    events: Event[];
    onEdit: (plot: Plot) => void;
    onCreate: (phaseType: string) => void;
    onDelete: (id: number) => void;
}

const PHASES = [
    { id: 'ki', label: '起 (Introduction)', color: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'sho', label: '承 (Development)', color: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'ten', label: '転 (Twist)', color: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { id: 'ketsu', label: '結 (Conclusion)', color: 'bg-red-50', borderColor: 'border-red-200' }
];

export default function PlotBoard({ plots, events, onEdit, onCreate, onDelete }: PlotBoardProps) {
    return (
        <div className="flex gap-4 h-full min-w-max pb-4">
            {PHASES.map(phase => (
                <PlotColumn
                    key={phase.id}
                    phase={phase}
                    plots={plots.filter(p => p.phase_type === phase.id)}
                    events={events}
                    onEdit={onEdit}
                    onCreate={() => onCreate(phase.id)}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
