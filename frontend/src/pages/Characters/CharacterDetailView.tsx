import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Character, type CustomAttribute, type Job, type Skill, type Equipment, type Event, type CharacterState } from '../../api';
import { ArrowLeft, Plus, Trash2, Copy, User, Swords, X, Loader2, Check } from 'lucide-react';
import StatusEditorPane from './components/StatusEditorPane';
import { useProfileAttributes } from '../../contexts/ProfileContext';

const STAT_LABELS: Record<string, string> = {
    hp: 'HP', mp: 'MP', str: '筋力', mag: '魔力', spd: '敏捷', luk: '運'
};
const STAT_KEYS = Object.keys(STAT_LABELS);

export default function CharacterDetailView() {
    const { profileAttributes } = useProfileAttributes();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'profile' | 'status'>('profile');

    const [character, setCharacter] = useState<Character | null>(null);
    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);

    // Phase 3 extensions
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [currentState, setCurrentState] = useState<CharacterState | undefined>(undefined);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // For new custom attribute
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState('');

    const fetchData = async () => {
        try {
            const [charRes, jobsRes, skillsRes, equipsRes, eventsRes] = await Promise.all([
                api.get<Character>(`/characters/${id}`),
                api.get<Job[]>('/jobs/'),
                api.get<Skill[]>('/skills/'),
                api.get<Equipment[]>('/equipments/'),
                api.get<Event[]>('/events/')
            ]);
            // Ensure talent_bonuses is initialized
            const charData = charRes.data;
            if (!charData.talent_bonuses) {
                charData.talent_bonuses = STAT_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
            }
            setCharacter(charData);
            setAvailableJobs(jobsRes.data);
            setAvailableSkills(skillsRes.data);
            setAvailableEquipments(equipsRes.data);
            setEvents(eventsRes.data);

            if (selectedEventId) {
                const statesRes = await api.get<CharacterState[]>(`/states/?event_id=${selectedEventId}&character_id=${id}`);
                if (statesRes.data.length > 0) {
                    setCurrentState(statesRes.data[0]);
                } else {
                    setCurrentState(undefined); // undefined signifies fallback to Global Character
                }
            } else {
                setCurrentState(undefined); // undefined signifies fallback to Global Character
            }
        } catch (e) {
            console.error(e);
            navigate('/characters');
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, selectedEventId]);

    const handleUpdateBasicInfo = (key: keyof Character, value: any) => {
        if (!character) return;
        setCharacter({ ...character, [key]: value });
    };

    const handleUpdateProfileData = (key: string, value: any) => {
        if (!character) return;
        setCharacter({
            ...character,
            profile_data: { ...(character.profile_data || {}), [key]: value }
        });
    };

    const handleSaveCharacter = useCallback(async (charToSave: Character) => {
        setSaveStatus('saving');
        try {
            await api.put(`/characters/${id}`, {
                name: charToSave.name,
                profile_data: charToSave.profile_data || {},
                visibility_settings: charToSave.visibility_settings as Record<string, any>,
                is_status_enabled: charToSave.is_status_enabled,
                job_id: charToSave.job_id,
                level: charToSave.level,
                talent_bonuses: charToSave.talent_bonuses as Record<string, any>
            });
            await api.put(`/characters/${id}/relationships`, {
                skill_ids: charToSave.skills.map(s => s.id),
                equipment_ids: charToSave.equipments.map(e => e.id)
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('idle');
        }
    }, [id]);

    // デバウンス用のタイマー
    useEffect(() => {
        if (!character) return;
        const timer = setTimeout(() => {
            handleSaveCharacter(character);
        }, 1000);
        return () => clearTimeout(timer);
    }, [character, handleSaveCharacter]);

    // computedStats, get/set skill & equipment functions has been moved inside StatusEditorPane and removed here.

    const handleAddAttribute = async () => {
        if (!newAttrName.trim() || !character) return;
        try {
            await handleSaveCharacter(character); // Save basic info first to prevent data loss
            await api.post(`/characters/${id}/attributes/`, {
                attribute_name: newAttrName,
                attribute_value: newAttrValue,
                is_public: false
            });
            setNewAttrName('');
            setNewAttrValue('');
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAttribute = async (attrId: number) => {
        if (!character) return;
        try {
            await handleSaveCharacter(character);
            await api.delete(`/attributes/${attrId}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateAttrValue = async (attr: CustomAttribute, newValue: string) => {
        try {
            await api.put(`/attributes/${attr.id}`, {
                attribute_name: attr.attribute_name,
                attribute_value: newValue,
                // visibility is deprecated in UI, keep as false
                is_public: false
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const generatePreviewText = () => {
        if (!character) return '';
        let text = `【${character.name}】\n`;
        profileAttributes.forEach(attr => {
            const val = character.profile_data?.[attr.key];
            if (val) text += `・${attr.name}: ${val}\n`;
        });
        if (character.attributes.length > 0) {
            text += `\n[追加情報]\n`;
            character.attributes.forEach(a => {
                if (a.attribute_value) text += `・${a.attribute_name}: ${a.attribute_value}\n`;
            });
        }
        if (character.is_status_enabled) {
            // Note: Since Export logic depends heavily on computed stats, 
            // Phase 3 simplifies export to mainly profile aspects unless integrated.
            text += `\n(詳細なステータス出力は「ステータス・装備・スキル」タブ側で行えます)\n`;
        }
        return text;
    };

    const handleOpenExportModal = () => {
        setExportText(generatePreviewText());
        setShowExportModal(true);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(exportText).then(() => {
            alert('公開用データをクリップボードにコピーしました。');
            setShowExportModal(false);
        });
    };

    if (!character) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <button
                onClick={() => navigate('/characters')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition self-start"
            >
                <ArrowLeft size={16} /> キャラクター一覧に戻る
            </button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
                        {character.name} <span className="text-gray-400 text-lg font-normal ml-2">設定・ステータス</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        {saveStatus === 'saving' && <span className="flex items-center text-gray-400 gap-1"><Loader2 size={14} className="animate-spin" /> 保存中...</span>}
                        {saveStatus === 'saved' && <span className="flex items-center text-green-600 gap-1"><Check size={14} /> 保存しました</span>}
                    </div>
                    <button
                        onClick={handleOpenExportModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition font-medium text-sm"
                    >
                        <Copy size={16} />
                        設定を出力
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <User size={18} /> プロフィール詳細編集
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'status' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Swords size={18} /> ステータス・装備・スキル
                </button>
            </div>

            <div className="flex-1 overflow-auto pb-8">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">基本情報</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                                    <input
                                        type="text"
                                        value={character.name}
                                        onChange={e => handleUpdateBasicInfo('name', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                                    />
                                </div>
                                {profileAttributes.map(attr => (
                                    <div key={attr.key} className="relative group">
                                        <div className="mb-1">
                                            <label className="block text-sm font-medium text-gray-700">{attr.name}</label>
                                        </div>
                                        {attr.type === 'tag' ? (
                                            <select
                                                value={character.profile_data?.[attr.key] || ''}
                                                onChange={e => handleUpdateProfileData(attr.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">(未設定)</option>
                                                {attr.tags?.map(tag => (
                                                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <textarea
                                                value={character.profile_data?.[attr.key] || ''}
                                                onChange={e => handleUpdateProfileData(attr.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[40px]"
                                                rows={1}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Attributes */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">追加属性</h3>
                            <div className="space-y-4 mb-8">
                                {character.attributes.map(attr => (
                                    <div key={attr.id} className="flex gap-2 items-start border border-gray-100 p-3 rounded-lg bg-gray-50 group">
                                        <div className="flex-1">
                                            <div className="mb-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">{attr.attribute_name}</span>
                                            </div>
                                            <input
                                                type="text"
                                                defaultValue={attr.attribute_value || ''}
                                                onBlur={e => handleUpdateAttrValue(attr, e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none py-1 text-sm font-medium"
                                                placeholder="値を入力"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAttribute(attr.id)}
                                            className="mt-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {character.attributes.length === 0 && (
                                    <p className="text-sm text-gray-500 italic text-center py-4">追加属性はありません。</p>
                                )}
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <h4 className="text-sm font-bold text-indigo-900 mb-3">新しい属性を追加</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="項目名 (例: 武器)"
                                        value={newAttrName}
                                        onChange={e => setNewAttrName(e.target.value)}
                                        className="flex-1 min-w-0 border-none rounded-lg px-3 py-2 text-sm shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="値"
                                        value={newAttrValue}
                                        onChange={e => setNewAttrValue(e.target.value)}
                                        className="flex-[2] min-w-0 border-none rounded-lg px-3 py-2 text-sm shadow-sm"
                                        onKeyDown={e => e.key === 'Enter' && handleAddAttribute()}
                                    />
                                    <button
                                        onClick={handleAddAttribute}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-sm"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'status' && (
                    <div className="space-y-6">
                        {/* Status Toggle & Essential Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">ステータス機能</h3>
                                    <p className="text-sm text-gray-500">このキャラクターの戦闘力や能力値を管理・計算しますか？</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={character.is_status_enabled}
                                        onChange={e => handleUpdateBasicInfo('is_status_enabled', e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {character.is_status_enabled ? (
                                <div className="space-y-6">
                                    {/* Timeline Selector */}
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-center gap-4">
                                        <label className="font-bold text-indigo-900 whitespace-nowrap">【対象タイムライン選択】</label>
                                        <select
                                            value={selectedEventId || ''}
                                            onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                                            className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700 max-w-md"
                                        >
                                            <option value="">初期設定 (デフォルト)</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.chapter_number} - {ev.event_name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-indigo-600">※変更すると下の内容が切り替わります</p>
                                    </div>

                                    {/* Status Editor Pane */}
                                    {selectedEventId && currentState === undefined ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                            データを読み込み中...
                                        </div>
                                    ) : (
                                        <StatusEditorPane
                                            character={character}
                                            currentState={currentState || null}
                                            availableJobs={availableJobs}
                                            availableSkills={availableSkills}
                                            availableEquipments={availableEquipments}
                                            onStateChange={fetchData}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Swords size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">ステータス機能は無効になっています。<br />右上のトグルをONにするとステータスや装備を管理できます。</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Copy size={20} className="text-indigo-600" />
                                出力用テキスト（プレビュー）
                            </h3>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-auto">
                            <p className="text-sm text-gray-500 mb-4">
                                下記のテキストはコピーする前に自由に編集できます。公開したくない情報は削ってからコピーしてください。
                            </p>
                            <textarea
                                value={exportText}
                                onChange={(e) => setExportText(e.target.value)}
                                className="w-full text-sm font-mono border border-gray-300 rounded-lg p-4 min-h-[400px] outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCopyToClipboard}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                            >
                                コピーして閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
