import { useState, useEffect } from 'react';
import { api, type Equipment, type Modifier } from '../../api';
import { Plus, Edit2, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react';

const STAT_LABELS: Record<string, string> = {
    hp: 'HP', mp: 'MP', str: '筋力', mag: '魔力', spd: '敏捷', luk: '運'
};
const STAT_KEYS = Object.keys(STAT_LABELS);
const RARITIES = ['N', 'R', 'SR', 'SSR', 'UR', 'Legendary'];

export default function EquipmentTab() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [rarity, setRarity] = useState('N');
    const [modifiers, setModifiers] = useState<Modifier[]>([]);

    const fetchEquipments = async () => {
        try {
            const res = await api.get<Equipment[]>('/equipments/');
            setEquipments(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchEquipments();
    }, []);

    const openModal = (item?: Equipment) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setDescription(item.description || '');
            setRarity(item.rarity || 'N');
            setModifiers(item.modifiers || []);
        } else {
            setEditingItem(null);
            setName('');
            setDescription('');
            setRarity('N');
            setModifiers([]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        const payload = { name, description, rarity, modifiers };
        try {
            if (editingItem) {
                await api.put(`/equipments/${editingItem.id}`, payload);
            } else {
                await api.post('/equipments/', payload);
            }
            fetchEquipments();
            closeModal();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await api.delete(`/equipments/${id}`);
            fetchEquipments();
        } catch (e) {
            console.error(e);
        }
    };

    const addModifier = () => {
        setModifiers([...modifiers, { attribute: 'str', type: 'flat', value: 0 }]);
    };

    const updateModifier = (index: number, field: keyof Modifier, val: any) => {
        const newMods = [...modifiers];
        newMods[index] = { ...newMods[index], [field]: val };
        setModifiers(newMods);
    };

    const removeModifier = (index: number) => {
        setModifiers(modifiers.filter((_, i) => i !== index));
    };

    const formatModifierLabel = (mod: Modifier) => {
        const sign = mod.value >= 0 ? '+' : '';
        const unit = mod.type === 'percent' ? '%' : '';
        return `${STAT_LABELS[mod.attribute] || mod.attribute} ${sign}${mod.value}${unit}`;
    };

    const getRarityColor = (r: string) => {
        switch (r) {
            case 'N': return 'text-gray-500 bg-gray-100 border-gray-200';
            case 'R': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'SR': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'SSR': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'UR': return 'text-red-600 bg-red-50 border-red-200';
            case 'Legendary': return 'text-yellow-600 bg-yellow-50 border-yellow-300 font-bold';
            default: return 'text-gray-500 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">装備品管理</h3>
                    <p className="text-sm text-gray-500 mt-1">武器や防具、装飾品などのアイテムと、そのステータス補正を管理します。</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> 装備品追加
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipments.map(eq => (
                        <div key={eq.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-gray-50/50 flex flex-col">
                            <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-indigo-700 text-lg">{eq.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${getRarityColor(eq.rarity || 'N')}`}>
                                            {eq.rarity || 'N'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{eq.description || '説明なし'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(eq)} className="text-gray-400 hover:text-indigo-600 transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(eq.id)} className="text-gray-400 hover:text-red-500 transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 text-sm">
                                <p className="font-bold text-xs text-gray-500 mb-1">ステータス補正</p>
                                {(!eq.modifiers || eq.modifiers.length === 0) ? (
                                    <span className="text-gray-400 text-xs">補正なし</span>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {eq.modifiers.map((mod, idx) => (
                                            <span key={idx} className={`px-2 py-0.5 rounded text-xs font-mono border ${mod.value >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {formatModifierLabel(mod)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {equipments.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            装備品がまだ登録されていません。
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl my-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold">{editingItem ? '装備品を編集' : '新規装備品追加'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">装備品名 *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">レア度</label>
                                    <select
                                        value={rarity}
                                        onChange={e => setRarity(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                        {RARITIES.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-800 text-sm">ステータス補正効果 (Modifiers)</h4>
                                    <button
                                        onClick={addModifier}
                                        className="text-indigo-600 flex items-center gap-1 text-xs hover:text-indigo-800 transition bg-indigo-50 px-2 py-1 rounded"
                                    >
                                        <PlusCircle size={14} /> 追加
                                    </button>
                                </div>

                                {modifiers.length === 0 ? (
                                    <p className="text-xs text-gray-400">補正効果はありません</p>
                                ) : (
                                    <div className="space-y-2">
                                        {modifiers.map((mod, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded">
                                                <select
                                                    value={mod.attribute}
                                                    onChange={e => updateModifier(index, 'attribute', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                                >
                                                    {STAT_KEYS.map(k => (
                                                        <option key={k} value={k}>{STAT_LABELS[k]}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={mod.type}
                                                    onChange={e => updateModifier(index, 'type', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                                >
                                                    <option value="flat">＋（実数）</option>
                                                    <option value="percent">％（割合）</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={mod.value}
                                                    onChange={e => updateModifier(index, 'value', parseInt(e.target.value) || 0)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none w-20 font-mono"
                                                    placeholder="値"
                                                />
                                                <button
                                                    onClick={() => removeModifier(index)}
                                                    className="text-red-400 justify-self-end ml-auto hover:text-red-600"
                                                >
                                                    <MinusCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
