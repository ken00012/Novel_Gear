import { useState, useEffect } from 'react';
import { api, type Job } from '../../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { LibraryEmptyState } from './components/LibraryShared';
import { useStatusAttributes } from '../../contexts/StatusContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function JobTab() {
    const { statusAttributes } = useStatusAttributes();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Job | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseStats, setBaseStats] = useState<Record<string, number>>({});
    const [statGrowth, setStatGrowth] = useState<Record<string, number>>({});

    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchJobs = async () => {
        try {
            const res = await api.get<Job[]>('/jobs/');
            setJobs(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const openModal = (item?: Job) => {
        const defaultStats = statusAttributes.reduce((acc, attr) => ({ ...acc, [attr.key]: 0 }), {});
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setDescription(item.description || '');
            setBaseStats({ ...defaultStats, ...(item.base_stats || {}) });
            setStatGrowth({ ...defaultStats, ...(item.stat_growth || {}) });
        } else {
            setEditingItem(null);
            setName('');
            setDescription('');
            setBaseStats(defaultStats);
            setStatGrowth(defaultStats);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        const payload = { name, description, base_stats: baseStats, stat_growth: statGrowth };
        try {
            if (editingItem) {
                await api.put(`/jobs/${editingItem.id}`, payload);
            } else {
                await api.post('/jobs/', payload);
            }
            fetchJobs();
            closeModal();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmDeleteId(id);
    };

    const executeDelete = async () => {
        if (confirmDeleteId === null) return;
        try {
            await api.delete(`/jobs/${confirmDeleteId}`);
            fetchJobs();
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const handleStatChange = (type: 'base' | 'growth', key: string, val: string) => {
        const num = parseInt(val) || 0;
        if (type === 'base') setBaseStats(prev => ({ ...prev, [key]: num }));
        if (type === 'growth') setStatGrowth(prev => ({ ...prev, [key]: num }));
    };

    return (
        <div className="bg-white rounded-lg shadow flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">ジョブ管理</h3>
                    <p className="text-sm text-gray-500 mt-1">冒険者の職業ごとの初期ステータスと成長率を定義します。</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> ジョブ追加
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-gray-50/50 flex flex-col">
                            <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-2">
                                <div>
                                    <h4 className="font-bold text-indigo-700 text-lg">{job.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{job.description || '説明なし'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(job)} className="text-gray-400 hover:text-indigo-600 transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(job.id)} className="text-gray-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Lv1 基礎値</span>
                                    <div className="grid grid-cols-3 gap-1 mt-1">
                                        {statusAttributes.map(attr => (
                                            <div key={attr.key} className="text-xs text-gray-700 bg-white p-1 rounded border border-gray-100 flex justify-between">
                                                <span className="text-gray-400">{attr.name}</span>
                                                <span className="font-mono">{job.base_stats?.[attr.key] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">LvUP 成長値</span>
                                    <div className="grid grid-cols-3 gap-1 mt-1">
                                        {statusAttributes.map(attr => (
                                            <div key={attr.key} className="text-xs text-gray-700 bg-white p-1 rounded border border-gray-100 flex justify-between">
                                                <span className="text-gray-400">{attr.name}</span>
                                                <span className="font-mono">+{job.stat_growth?.[attr.key] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {jobs.length === 0 && (
                        <LibraryEmptyState message="ジョブがまだ登録されていません。" />
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl my-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-pb-2">
                            <h3 className="text-lg font-bold">{editingItem ? 'ジョブを編集' : '新規ジョブ追加'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ジョブ名 *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 border-indigo-500 outline-none z-10 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-medium text-gray-800 mb-3 text-sm">Lv1 基礎パラメータ</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {statusAttributes.map(attr => (
                                        <div key={`base-${attr.key}`}>
                                            <label className="block text-xs text-gray-500 mb-1" title={attr.description || ''}>{attr.name}</label>
                                            <input
                                                type="number"
                                                value={baseStats[attr.key] ?? 0}
                                                onChange={e => handleStatChange('base', attr.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400 font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-medium text-gray-800 mb-3 text-sm">レベルアップごとの成長値</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {statusAttributes.map(attr => (
                                        <div key={`growth-${attr.key}`}>
                                            <label className="block text-xs text-gray-500 mb-1" title={attr.description || ''}>{attr.name}</label>
                                            <input
                                                type="number"
                                                value={statGrowth[attr.key] ?? 0}
                                                onChange={e => handleStatChange('growth', attr.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-green-400 font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
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

            <ConfirmModal
                isOpen={confirmDeleteId !== null}
                message="本当に削除しますか？"
                onConfirm={executeDelete}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
}
