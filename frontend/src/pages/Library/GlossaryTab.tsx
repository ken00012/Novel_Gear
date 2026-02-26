import { useState, useEffect } from 'react';
import { api, type Glossary } from '../../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { LibraryEmptyState } from './components/LibraryShared';

export default function GlossaryTab() {
    const [glossaries, setGlossaries] = useState<Glossary[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Glossary | null>(null);

    const [term, setTerm] = useState('');
    const [description, setDescription] = useState('');

    const fetchGlossaries = async () => {
        try {
            const res = await api.get<Glossary[]>('/glossary/');
            setGlossaries(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchGlossaries();
    }, []);

    const openModal = (item?: Glossary) => {
        if (item) {
            setEditingItem(item);
            setTerm(item.term);
            setDescription(item.description || '');
        } else {
            setEditingItem(null);
            setTerm('');
            setDescription('');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setTerm('');
        setDescription('');
    };

    const handleSave = async () => {
        if (!term.trim()) return;
        try {
            if (editingItem) {
                await api.put(`/glossary/${editingItem.id}`, { term, description });
            } else {
                await api.post('/glossary/', { term, description });
            }
            fetchGlossaries();
            closeModal();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await api.delete(`/glossary/${id}`);
            fetchGlossaries();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">世界観用語集</h3>
                    <p className="text-sm text-gray-500 mt-1">物語の世界観や専門用語を管理します。</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> 用語追加
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {glossaries.map(g => (
                        <div key={g.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-gray-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-indigo-700 text-lg">{g.term}</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(g)} className="text-gray-400 hover:text-indigo-600 transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(g.id)} className="text-gray-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{g.description || '説明なし'}</p>
                        </div>
                    ))}
                    {glossaries.length === 0 && (
                        <LibraryEmptyState message="用語がまだ登録されていません。" />
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{editingItem ? '用語を編集' : '新規用語追加'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">用語名 *</label>
                                <input
                                    type="text"
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="例: 魔法"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[120px]"
                                    placeholder="用語の解説や設定を入力..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                キャンセル
                            </button>
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                                保存する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
