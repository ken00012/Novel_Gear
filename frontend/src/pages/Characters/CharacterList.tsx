import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Character } from '../../api';
import { UserPlus, Settings, Trash2 } from 'lucide-react';

export default function CharacterList() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCharName, setNewCharName] = useState('');

    const fetchCharacters = async () => {
        try {
            const res = await api.get<Character[]>('/characters/');
            setCharacters(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    const handleAddCharacter = async () => {
        if (!newCharName.trim()) return;
        try {
            await api.post('/characters/', { name: newCharName, visibility_settings: {} });
            setNewCharName('');
            setIsModalOpen(false);
            fetchCharacters();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCharacter = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (!window.confirm(`「${name}」を削除しますか？\n関連するステータス等のデータも全て消去されます。`)) return;
        try {
            await api.delete(`/characters/${id}`);
            fetchCharacters();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">登場人物管理</h2>
                    <p className="text-sm text-gray-500 mt-1">物語を彩るキャラクターたちの情報を一元管理します。</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <UserPlus size={18} />
                    <span>新規キャラクター</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map(char => (
                    <div key={char.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">{char.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{char.faction || '陣営未設定'}</p>
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

                        <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                            <button
                                onClick={() => navigate(`/characters/${char.id}`)}
                                className="flex-1 flex justify-center items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg transition font-medium shadow-sm"
                            >
                                <Settings size={16} /> 詳細編集
                            </button>
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
        </div>
    );
}
