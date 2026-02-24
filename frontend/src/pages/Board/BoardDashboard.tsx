import { useState, useEffect, useRef } from 'react';
import { api, type BoardThread } from '../../api';
import BoardEditor from './components/BoardEditor';
import { Plus, Trash2, MessageSquare, Edit2, Check, X } from 'lucide-react';

export default function BoardDashboard() {
    const [threads, setThreads] = useState<BoardThread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);

    const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
    const [editContext, setEditContext] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        // 編集モードに入った時にオートフォーカス
        if (editingThreadId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingThreadId]);

    const handleCreateThread = async () => {
        try {
            const res = await api.post<BoardThread>('/board_threads/', { title: '新規スレッド' });
            setThreads([res.data, ...threads]);
            setSelectedThreadId(res.data.id);
            setEditingThreadId(res.data.id);
            setEditContext('新規スレッド');
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateThreadTitle = async (id: number) => {
        if (!editContext.trim()) {
            setEditingThreadId(null);
            return;
        }
        const thread = threads.find(t => t.id === id);
        if (!thread) return;

        try {
            await api.put(`/board_threads/${id}`, { ...thread, title: editContext });
            setThreads(threads.map(t => t.id === id ? { ...t, title: editContext } : t));
            setEditingThreadId(null);
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
                            onClick={() => {
                                if (editingThreadId !== thread.id) setSelectedThreadId(thread.id);
                            }}
                            className={`p-3 border-b cursor-pointer group transition ${selectedThreadId === thread.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                        >
                            {editingThreadId === thread.id ? (
                                <div className="flex flex-col gap-1">
                                    <input
                                        ref={editInputRef}
                                        value={editContext}
                                        onChange={e => setEditContext(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateThreadTitle(thread.id);
                                            if (e.key === 'Escape') setEditingThreadId(null);
                                        }}
                                        className="w-full text-sm p-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <div className="flex justify-end gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleUpdateThreadTitle(thread.id); }} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Check size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingThreadId(null); }} className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"><X size={12} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div className="truncate text-sm font-medium text-gray-800 flex-1 pr-2">{thread.title}</div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingThreadId(thread.id);
                                                setEditContext(thread.title);
                                            }}
                                            className="text-gray-400 hover:text-indigo-600 p-1"
                                            title="名前を編集"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                            title="削除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
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
