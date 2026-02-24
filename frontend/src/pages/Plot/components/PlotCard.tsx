import { Pencil, Trash2, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Plot, type Event } from '../../../api';

interface PlotCardProps {
    plot: Plot;
    event?: Event;
    onEdit: () => void;
    onDelete: () => void;
}

export default function PlotCard({ plot, event, onEdit, onDelete }: PlotCardProps) {
    const navigate = useNavigate();

    const handleJumpToStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event) {
            navigate(`/status?eventId=${event.id}`);
        }
    };

    return (
        <div
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 group transition relative"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800 text-sm">{plot.title || '無題のプロット'}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={onEdit} className="text-gray-400 hover:text-indigo-600 p-1" title="編集">
                        <Pencil size={14} />
                    </button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1" title="削除">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {plot.character_arc && (
                <div className="mb-3">
                    <div className="text-xs font-semibold text-indigo-500 mb-1">Character Arc</div>
                    <p className="text-xs text-gray-600 line-clamp-3 bg-indigo-50/50 p-2 rounded">
                        {plot.character_arc}
                    </p>
                </div>
            )}

            {event ? (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 truncate max-w-[150px]" title={`第${event.chapter_number}話: ${event.event_name}`}>
                        <span className="font-medium">連動:</span> 第{event.chapter_number}話
                    </div>
                    <button
                        onClick={handleJumpToStatus}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition"
                        title="ステータス詳細を確認"
                    >
                        <ArrowRightCircle size={14} />
                        Status
                    </button>
                </div>
            ) : (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">タイムライン未設定</span>
                </div>
            )}
        </div>
    );
}
