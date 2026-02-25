import { useState, useEffect } from 'react';
import { api, type BoardNamePreset } from '../../../api';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';

interface BoardNameLibraryEditorProps {
    onClose: () => void;
    onListUpdated: () => void;
}

export default function BoardNameLibraryEditor({ onClose, onListUpdated }: BoardNameLibraryEditorProps) {
    const [presets, setPresets] = useState<BoardNamePreset[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editItem, setEditItem] = useState<{ name: string; user_id_str: string }>({ name: '', user_id_str: '' });

    // For new creation inside modal
    const [isCreating, setIsCreating] = useState(false);
    const [newItem, setNewItem] = useState<{ name: string; user_id_str: string }>({ name: '', user_id_str: '' });

    const fetchPresets = async () => {
        try {
            const res = await api.get<BoardNamePreset[]>('/board_name_presets/');
            // Sort conceptually by order_index (though API currently returns as-is)
            const sorted = [...res.data].sort((a, b) => a.order_index - b.order_index);
            setPresets(sorted);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchPresets();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('この名前プリセットを削除しますか？')) return;
        try {
            await api.delete(`/board_name_presets/${id}`);
            setPresets(presets.filter(p => p.id !== id));
            onListUpdated();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editItem.name.trim()) return;
        const target = presets.find(p => p.id === id);
        if (!target) return;

        try {
            const res = await api.put<BoardNamePreset>(`/board_name_presets/${id}`, {
                ...target,
                name: editItem.name,
                user_id_str: editItem.user_id_str || null
            });
            setPresets(presets.map(p => p.id === id ? res.data : p));
            setEditingId(null);
            onListUpdated();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        if (!newItem.name.trim()) return;
        try {
            const res = await api.post<BoardNamePreset>('/board_name_presets/', {
                name: newItem.name,
                user_id_str: newItem.user_id_str || null,
                order_index: presets.length
            });
            setPresets([...presets, res.data]);
            setIsCreating(false);
            setNewItem({ name: '', user_id_str: '' });
            onListUpdated();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">名前ライブラリの管理</h3>
                        <p className="text-sm text-gray-500 mt-1">掲示板の投稿で使用する「名前」と「固定ID」のプリセットを管理します。</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCreating && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm font-medium"
                            >
                                <Plus size={16} /> 新規登録
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="flex flex-col gap-3">
                        {isCreating && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 shadow-sm mb-4">
                                <h4 className="text-sm font-bold text-indigo-800 mb-3">新規プリセット追加</h4>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">名前 <span className="text-red-500">*</span></label>
                                        <input
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="例: 名無しさん"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">固定ID (任意)</label>
                                        <input
                                            value={newItem.user_id_str}
                                            onChange={e => setNewItem({ ...newItem, user_id_str: e.target.value })}
                                            className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="例: ABCD1234"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsCreating(false)} className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded transition">キャンセル</button>
                                    <button onClick={handleCreate} disabled={!newItem.name.trim()} className="px-4 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded transition">登録する</button>
                                </div>
                            </div>
                        )}

                        {presets.map(preset => (
                            <div key={preset.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow transition group flex items-center justify-between">
                                {editingId === preset.id ? (
                                    <div className="flex-1 flex gap-3 items-center">
                                        <input
                                            value={editItem.name}
                                            onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                            className="flex-1 text-sm p-1.5 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="名前"
                                            autoFocus
                                        />
                                        <input
                                            value={editItem.user_id_str}
                                            onChange={e => setEditItem({ ...editItem, user_id_str: e.target.value })}
                                            className="w-32 text-sm p-1.5 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="ID (任意)"
                                        />
                                        <div className="flex gap-1 ml-2">
                                            <button onClick={() => handleUpdate(preset.id)} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700" title="保存">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300" title="キャンセル">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex flex-col">
                                            <span className="font-bold text-gray-800 text-sm">{preset.name}</span>
                                            {preset.user_id_str && (
                                                <span className="text-xs text-gray-500 mt-0.5 font-mono">ID: {preset.user_id_str}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100">
                                            <button
                                                onClick={() => {
                                                    setEditingId(preset.id);
                                                    setEditItem({ name: preset.name, user_id_str: preset.user_id_str || '' });
                                                }}
                                                className="text-gray-400 hover:text-indigo-600 p-2 transition"
                                                title="編集"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(preset.id)}
                                                className="text-gray-400 hover:text-red-500 p-2 transition"
                                                title="削除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {presets.length === 0 && !isCreating && (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                名前プリセットが登録されていません。右上のボタンから追加してください。
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
