import { useState, useEffect } from 'react';
import { api, type BoardThread } from '../../api';
import BoardEditor from './components/BoardEditor';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

export default function BoardDashboard() {
    const [threads, setThreads] = useState<BoardThread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);

    const fetchThreads = async () => {
        try {
            const res = await api.get<BoardThread[]>('/board_threads/');
            setThreads(res.data);
            if (res.data.length > 0 && !selectedThreadId) {
                setSelectedThreadId(res.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateThread = async () => {
        const title = prompt('新しいスレッドのタイトルを入力してください\n例: 【悲報】勇者、またパーティ追放される');
        if (!title) return;
        try {
            const res = await api.post<BoardThread>('/board_threads/', { title });
            setThreads([res.data, ...threads]);
            setSelectedThreadId(res.data.id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteThread = async (id: number) => {
        if (!confirm('本当にこのスレッドを削除しますか？\n（含まれるすべての書き込みも消去されます）')) return;
        try {
            await api.delete(`/board_threads/${id}`);
            if (selectedThreadId === id) setSelectedThreadId(null);
            fetchThreads();
        } catch (e) {
            console.error(e);
        }
    }

    const selectedThread = threads.find(t => t.id === selectedThreadId);

    return (
        <div className="flex h-full bg-white">
            <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0">
                <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
                    <h2 className="font-bold text-gray-800 flex items-center gap-1"><MessageSquare size={18} /> スレッド一覧</h2>
                    <button onClick={handleCreateThread} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition" title="新規スレッド作成">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {threads.map(thread => (
                        <div
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={`p-3 border-b cursor-pointer flex justify-between items-center group transition ${selectedThreadId === thread.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                        >
                            <div className="truncate text-sm font-medium text-gray-800 flex-1">{thread.title}</div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 transition"
                                title="スレッド削除"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {threads.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-500">
                            まだスレッドがありません。<br />右上の＋ボタンから作成してください。
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {selectedThread ? (
                    <BoardEditor thread={selectedThread} onThreadUpdate={fetchThreads} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <MessageSquare size={48} className="text-gray-300" />
                        <div>スレッドを選択、または新規作成してください。</div>
                    </div>
                )}
            </div>
        </div>
    );
}
