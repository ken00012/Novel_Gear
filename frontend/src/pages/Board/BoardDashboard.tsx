import { useState, useEffect } from 'react';
import { api, type BoardThread } from '../../api';
import BoardEditor from './components/BoardEditor';
import { Plus, Trash2, MessageSquare, Pencil } from 'lucide-react';
import CreateItemForm from '../../components/common/CreateItemForm';
import ConfirmModal from '../../components/ConfirmModal';

export default function BoardDashboard() {
    const [threads, setThreads] = useState<BoardThread[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [showNewThread, setShowNewThread] = useState(false);

    const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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

    const handleCreateThread = async (chapter: string, title: string) => {
        if (!title.trim()) return;
        try {
            const res = await api.post<BoardThread>('/board_threads/', {
                title: title,
                chapter_number: chapter || null
            });
            setThreads([res.data, ...threads]);
            setSelectedThreadId(res.data.id);
            setShowNewThread(false);
        } catch (e) {
            console.error(e);
        }
    };
    const handleUpdateThreadTitle = async (id: number, chapter: string, title: string) => {
        if (!title.trim()) {
            setEditingThreadId(null);
            return;
        }
        const thread = threads.find(t => t.id === id);
        if (!thread) return;

        try {
            await api.put(`/board_threads/${id}`, {
                ...thread,
                title: title,
                chapter_number: chapter || null
            });
            setThreads(threads.map(t => t.id === id ? { ...t, title, chapter_number: chapter || null } : t));
            setEditingThreadId(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteThread = (id: number) => {
        setConfirmDeleteId(id);
    };

    const executeDeleteThread = async () => {
        if (confirmDeleteId === null) return;
        try {
            await api.delete(`/board_threads/${confirmDeleteId}`);
            if (selectedThreadId === confirmDeleteId) setSelectedThreadId(null);
            fetchThreads();
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const selectedThread = threads.find(t => t.id === selectedThreadId);

    return (
        <div className="flex h-full bg-white">
            <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0">
                <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
                    <h2 className="font-bold text-gray-800 flex items-center gap-1"><MessageSquare size={18} /> スレッド一覧</h2>
                    <button onClick={() => setShowNewThread(!showNewThread)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition" title="新規スレッド作成">
                        <Plus size={18} />
                    </button>
                </div>
                {showNewThread && (
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <CreateItemForm
                            chapterLabel="章番号"
                            chapterPlaceholder="例: 第1話"
                            titleLabel="スレッドタイトル"
                            titlePlaceholder="例: 魔王倒したんだけど質問ある？"
                            onSubmit={handleCreateThread}
                            onCancel={() => setShowNewThread(false)}
                            submitLabel="作成"
                        />
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {threads.map(thread => (
                        editingThreadId === thread.id ? (
                            <CreateItemForm
                                key={thread.id}
                                chapterLabel="章番号"
                                chapterPlaceholder="例: 第1話"
                                titleLabel="スレッドタイトル"
                                titlePlaceholder="例: テストスレッド"
                                initialChapter={thread.chapter_number || ''}
                                initialTitle={thread.title}
                                onSubmit={(ch, tit) => handleUpdateThreadTitle(thread.id, ch, tit)}
                                onCancel={() => setEditingThreadId(null)}
                                submitLabel="保存"
                            />
                        ) : (
                            <div
                                key={thread.id}
                                onClick={() => setSelectedThreadId(thread.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition relative group ${selectedThreadId === thread.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="pr-16">
                                    <div className="text-xs font-bold text-indigo-600 mb-1">{thread.chapter_number || ''}</div>
                                    <div className="text-sm text-gray-800 font-medium">{thread.title}</div>
                                </div>
                                <div className="absolute top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingThreadId(thread.id);
                                        }}
                                        className="text-gray-400 hover:text-indigo-600 transition p-1"
                                        title="名前を編集"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                        title="削除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
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

            <ConfirmModal
                isOpen={confirmDeleteId !== null}
                message="本当にこのスレッドを削除しますか？\n（含まれるすべての書き込みも消去されます）"
                onConfirm={executeDeleteThread}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
}
