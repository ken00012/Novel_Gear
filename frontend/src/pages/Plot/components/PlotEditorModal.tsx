import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Plot, type Event } from '../../../api';

interface PlotEditorModalProps {
    plot: Plot | null;
    phaseType: string;
    events: Event[];
    onSave: (plot: Partial<Plot>) => void;
    onClose: () => void;
}

export default function PlotEditorModal({ plot, phaseType, events, onSave, onClose }: PlotEditorModalProps) {
    const [title, setTitle] = useState('');
    const [characterArc, setCharacterArc] = useState('');
    const [content, setContent] = useState('');
    const [eventId, setEventId] = useState<number | ''>('');

    useEffect(() => {
        if (plot) {
            setTitle(plot.title || '');
            setCharacterArc(plot.character_arc || '');
            setContent(plot.content || '');
            setEventId(plot.event_id || '');
        } else {
            setTitle('');
            setCharacterArc('');
            setContent('');
            setEventId('');
        }
    }, [plot]);

    const handleSave = () => {
        onSave({
            ...(plot ? { id: plot.id } : {}),
            phase_type: phaseType,
            title,
            character_arc: characterArc,
            content,
            event_id: eventId === '' ? null : Number(eventId),
            order_index: plot?.order_index || 0
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold">{plot ? 'プロットを編集' : 'プロットを追加'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="例: 魔王軍の奇襲"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">対象タイムライン (連動)</label>
                        <select
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="">-- 未設定 --</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>第{ev.chapter_number}話: {ev.event_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-600 mb-1">キャラクターアーク (感情や関係性の変化)</label>
                        <textarea
                            value={characterArc}
                            onChange={(e) => setCharacterArc(e.target.value)}
                            className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
                            placeholder="例: 主人公が仲間を信じる重要性に気づく。ライバルとの和解。"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">エピソード内容 (詳細)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-40"
                            placeholder="具体的なあらすじや構成メモ"
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-sm font-medium"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
                    >
                        保存する
                    </button>
                </div>
            </div>
        </div>
    );
}
