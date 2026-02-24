import { useState, useEffect } from 'react';
import { api, type Plot, type Event } from '../../api';
import PlotBoard from './components/PlotBoard';
import PlotEditorModal from './components/PlotEditorModal';

export default function PlotDashboard() {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
    const [isCreating, setIsCreating] = useState<string | null>(null); // phase_type of new plot

    const fetchData = async () => {
        try {
            const [plotsRes, eventsRes] = await Promise.all([
                api.get<Plot[]>('/plots/'),
                api.get<Event[]>('/events/')
            ]);
            setPlots(plotsRes.data);
            setEvents(eventsRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSavePlot = async (plot: Partial<Plot>) => {
        try {
            if (plot.id) {
                await api.put(`/plots/${plot.id}`, plot);
            } else {
                await api.post('/plots/', plot);
            }
            setEditingPlot(null);
            setIsCreating(null);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeletePlot = async (id: number) => {
        if (!confirm('このプロットを削除しますか？')) return;
        try {
            await api.delete(`/plots/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">プロット管理 (起承転結ボード)</h2>

            <div className="flex-1 overflow-x-auto">
                <PlotBoard
                    plots={plots}
                    events={events}
                    onEdit={(plot) => setEditingPlot(plot)}
                    onCreate={(phase_type) => setIsCreating(phase_type)}
                    onDelete={handleDeletePlot}
                />
            </div>

            {(editingPlot || isCreating) && (
                <PlotEditorModal
                    plot={editingPlot}
                    phaseType={isCreating || editingPlot?.phase_type || 'ki'}
                    events={events}
                    onSave={handleSavePlot}
                    onClose={() => { setEditingPlot(null); setIsCreating(null); }}
                />
            )}
        </div>
    );
}
