import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Character } from '../../api';
import { UserPlus, Settings, Trash2, User, Swords } from 'lucide-react';
import { useProfileAttributes } from '../../contexts/ProfileContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function CharacterList() {
    const { profileAttributes } = useProfileAttributes();
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const [displayItems, setDisplayItems] = useState<string[]>(['陣営']);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editDisplayItems, setEditDisplayItems] = useState<string[]>([]);

    const [confirmDeleteCharacter, setConfirmDeleteCharacter] = useState<{ id: number | null, name: string }>({ id: null, name: '' });

    const fetchCharacters = async () => {
        try {
            const res = await api.get<Character[]>('/characters/');
            setCharacters(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get<{ setting_value: string[] }>('/app_settings/card_display_items');
            setDisplayItems(res.data.setting_value);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCharacters();
        fetchSettings();
    }, []);

    const handleAddCharacter = async () => {
        if (!newCharName.trim()) return;
        try {
            await api.post('/characters/', { name: newCharName, visibility_settings: {}, profile_data: {} });
            setNewCharName('');
            setIsModalOpen(false);
            fetchCharacters();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCharacter = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setConfirmDeleteCharacter({ id, name });
    };

    const executeDeleteCharacter = async () => {
        if (confirmDeleteCharacter.id === null) return;
        try {
            await api.delete(`/characters/${confirmDeleteCharacter.id}`);
            fetchCharacters();
        } catch (err) {
            console.error(err);
        } finally {
            setConfirmDeleteCharacter({ id: null, name: '' });
        }
    };

    const handleSaveSettings = async () => {
        try {
            await api.put('/app_settings/card_display_items', {
                setting_key: 'card_display_items',
                setting_value: editDisplayItems
            });
            setDisplayItems(editDisplayItems);
            setIsSettingsModalOpen(false);
        } catch (e) {
            console.error(e);
        }
    };

    const openSettingsModal = () => {
        setEditDisplayItems(displayItems);
        setIsSettingsModalOpen(true);
    };

    const toggleDisplayItem = (key: string) => {
        setEditDisplayItems(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">登場人物管理</h2>
                    <p className="text-sm text-gray-500 mt-1">物語を彩るキャラクターたちの情報を一元管理します。</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openSettingsModal}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
                    >
                        <Settings size={18} />
                        <span>カード表示設定</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                        <UserPlus size={18} />
                        <span>新規キャラクター</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map(char => (
                    <div key={char.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">{char.name}</h3>
                                <div className="text-sm text-gray-500 mt-3 space-y-1.5">
                                    {displayItems.length > 0 ? (
                                        displayItems.map(key => {
                                            const attr = profileAttributes.find(a => a.key === key);
                                            if (!attr) return null;
                                            return (
                                                <div key={key} className="flex gap-2">
                                                    <span className="text-gray-400 font-medium w-12 text-xs py-0.5">{attr.name}</span>
                                                    <span className="text-gray-800 font-medium">
                                                        {char.profile_data?.[key] || <span className="text-gray-300 font-normal">未設定</span>}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-gray-400 italic text-xs py-1">追加表示なし</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {char.name.charAt(0)}
                                </div>
                                <button
                                    onClick={(e) => handleDeleteCharacter(e, char.id, char.name)}
                                    className="text-gray-300 hover:text-red-500 transition p-1"
                                    title="削除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                            <button
                                onClick={() => navigate(`/characters/${char.id}?tab=profile`)}
                                className="flex-1 flex justify-center items-center gap-1.5 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 py-2.5 rounded-lg transition font-medium shadow-sm"
                            >
                                <User size={16} /> プロフィール編集
                            </button>
                            {char.is_status_enabled && (
                                <button
                                    onClick={() => navigate(`/characters/${char.id}?tab=status`)}
                                    className="flex-1 flex justify-center items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg transition font-medium shadow-sm"
                                >
                                    <Swords size={16} /> ステータス
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {characters.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        キャラクターがまだ登録されていません。「新規キャラクター」から追加してください。
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold mb-4">新規キャラクター追加</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                            <input
                                type="text"
                                value={newCharName}
                                onChange={e => setNewCharName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="キャラクター名を入力"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddCharacter()}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleAddCharacter}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                追加する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
                        <h3 className="text-lg font-bold mb-2">カード表示項目の設定</h3>
                        <p className="text-sm text-gray-500 mb-4">キャラクター一覧画面のカードに表示するプロフィール項目を選択してください。</p>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 border border-gray-100 rounded-lg p-3 bg-gray-50">
                            {profileAttributes.length === 0 ? (
                                <p className="text-sm text-gray-400">プロフィール項目が設定されていません</p>
                            ) : (
                                profileAttributes.map(attr => (
                                    <label key={attr.key} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-indigo-50 transition">
                                        <input
                                            type="checkbox"
                                            checked={editDisplayItems.includes(attr.key)}
                                            onChange={() => toggleDisplayItem(attr.key)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-gray-800">{attr.name}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                設定を保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDeleteCharacter.id !== null}
                message={`「${confirmDeleteCharacter.name}」を削除しますか？\n関連するステータス等のデータも全て消去されます。`}
                onConfirm={executeDeleteCharacter}
                onCancel={() => setConfirmDeleteCharacter({ id: null, name: '' })}
            />
        </div>
    );
}
