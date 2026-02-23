import { useState, useEffect } from 'react';
import { api, type Event, type Character, type CharacterState } from '../../api';
import { Plus, Save, Check, Copy, Trash2 } from 'lucide-react';

export default function StatusDashboardView() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<number | null>(null);

    const [currentState, setCurrentState] = useState<CharacterState | null>(null);

    // New Event Form
    const [showNewEvent, setShowNewEvent] = useState(false);
    const [newChapter, setNewChapter] = useState('');
    const [newEventName, setNewEventName] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchCharacters();
    }, []);

    useEffect(() => {
        if (selectedEventId && selectedCharId) {
            fetchState(selectedEventId, selectedCharId);
        } else {
            setCurrentState(null);
        }
    }, [selectedEventId, selectedCharId]);

    const fetchEvents = async () => {
        try {
            const res = await api.get<Event[]>('/events/');
            setEvents(res.data);
            if (res.data.length > 0 && !selectedEventId) {
                setSelectedEventId(res.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCharacters = async () => {
        try {
            const res = await api.get<Character[]>('/characters/');
            setCharacters(res.data);
            if (res.data.length > 0 && !selectedCharId) {
                setSelectedCharId(res.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchState = async (eventId: number, charId: number) => {
        try {
            const res = await api.get<CharacterState[]>(`/states/?event_id=${eventId}&character_id=${charId}`);
            if (res.data.length > 0) {
                setCurrentState(res.data[0]);
            } else {
                // Init empty state
                setCurrentState({
                    id: 0,
                    character_id: charId,
                    event_id: eventId,
                    hp_base: 0, hp_mod: 0,
                    mp_base: 0, mp_mod: 0,
                    str_base: 0, str_mod: 0,
                    mag_base: 0, mag_mod: 0,
                    spd_base: 0, spd_mod: 0,
                    luk_base: 0, luk_mod: 0,
                    visibility_settings: {}
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddEvent = async () => {
        if (!newChapter.trim() || !newEventName.trim()) return;
        try {
            const res = await api.post<Event>('/events/', {
                chapter_number: newChapter,
                event_name: newEventName,
                order_index: events.length
            });
            setNewChapter('');
            setNewEventName('');
            setShowNewEvent(false);
            await fetchEvents();
            setSelectedEventId(res.data.id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteEvent = async (e: React.MouseEvent, eventId: number) => {
        e.stopPropagation();
        if (!window.confirm('このイベントを削除しますか？\n※関連する各キャラクターのステータス情報も失われます。')) return;
        try {
            await api.delete(`/events/${eventId}`);
            if (selectedEventId === eventId) {
                setSelectedEventId(null);
            }
            await fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatChange = (key: keyof CharacterState, value: string) => {
        if (!currentState) return;
        const numValue = parseInt(value, 10);
        setCurrentState({ ...currentState, [key]: isNaN(numValue) ? 0 : numValue });
    };

    const handleSaveState = async () => {
        if (!currentState || !selectedEventId || !selectedCharId) return;
        setIsSaving(true);
        try {
            await api.post(`/characters/${selectedCharId}/states/`, {
                ...currentState,
                event_id: selectedEventId
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            fetchState(selectedEventId, selectedCharId);
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    };

    const statFields = [
        { key: 'hp', label: 'HP' },
        { key: 'mp', label: 'MP' },
        { key: 'str', label: '筋力' },
        { key: 'mag', label: '魔力' },
        { key: 'spd', label: '速さ' },
        { key: 'luk', label: '運' },
    ];

    return (
        <div className="flex h-full bg-gray-50 border-t border-gray-200">
            {/* Timeline Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">タイムライン</h3>
                    <button
                        onClick={() => setShowNewEvent(!showNewEvent)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {showNewEvent && (
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                        <input
                            type="text"
                            placeholder="章番号 (例: 第1話)"
                            value={newChapter}
                            onChange={e => setNewChapter(e.target.value)}
                            className="w-full mb-2 text-sm px-2 py-1.5 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="イベント名 (例: 魔王討伐後)"
                            value={newEventName}
                            onChange={e => setNewEventName(e.target.value)}
                            className="w-full mb-3 text-sm px-2 py-1.5 border rounded"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowNewEvent(false)} className="text-xs text-gray-500">キャンセル</button>
                            <button onClick={handleAddEvent} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded">追加</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {events.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">イベントがありません</p>
                    ) : (
                        events.map(ev => (
                            <div
                                key={ev.id}
                                onClick={() => setSelectedEventId(ev.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition relative group ${selectedEventId === ev.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-xs font-bold text-indigo-600 mb-1">{ev.chapter_number}</div>
                                <div className="text-sm text-gray-800 font-medium pr-6">{ev.event_name}</div>
                                <button
                                    onClick={(e) => handleDeleteEvent(e, ev.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Status Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">ステータスエディタ</h2>
                        <p className="text-sm text-gray-500 mt-1">選択したイベントにおける各キャラクターの能力値を設定します</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (!currentState || !selectedCharId) return;
                                const char = characters.find(c => c.id === selectedCharId);
                                let text = `【${char?.name || '不明'} のステータス】\n`;
                                statFields.forEach(stat => {
                                    if (currentState.visibility_settings[stat.key]) {
                                        const baseKey = `${stat.key}_base` as keyof CharacterState;
                                        const modKey = `${stat.key}_mod` as keyof CharacterState;
                                        const total = ((currentState[baseKey] as number) || 0) + ((currentState[modKey] as number) || 0);
                                        text += `・${stat.label}: ${total}\n`;
                                    }
                                });
                                navigator.clipboard.writeText(text).then(() => {
                                    alert('公開用ステータスをクリップボードにコピーしました！');
                                });
                            }}
                            disabled={!currentState}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition ${!currentState ? 'border-gray-300 text-gray-400 bg-gray-50' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                                }`}
                        >
                            <Copy size={16} />
                            公開用テキストをコピー
                        </button>
                        <button
                            onClick={handleSaveState}
                            disabled={isSaving || !currentState}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition text-white text-sm font-medium ${saveSuccess ? 'bg-green-500 hover:bg-green-600'
                                : (!currentState ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700')
                                }`}
                        >
                            {saveSuccess ? <Check size={16} /> : <Save size={16} />}
                            {saveSuccess ? '保存完了' : '状態を保存'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                    {/* Character Selector */}
                    <div className="w-1/3 max-w-xs space-y-2">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">対象キャラクター</h4>
                        {characters.map(char => (
                            <div
                                key={char.id}
                                onClick={() => setSelectedCharId(char.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedCharId === char.id
                                    ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                    : 'bg-white border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedCharId === char.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {char.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800">{char.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stat Editor */}
                    <div className="flex-1 max-w-2xl">
                        {selectedEventId && selectedCharId && currentState ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{characters.find(c => c.id === selectedCharId)?.name} のステータス</h3>
                                        <div className="text-sm text-indigo-600 mt-1 font-medium">
                                            {events.find(e => e.id === selectedEventId)?.chapter_number} - {events.find(e => e.id === selectedEventId)?.event_name}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {statFields.map(stat => {
                                        const baseKey = `${stat.key}_base` as keyof CharacterState;
                                        const modKey = `${stat.key}_mod` as keyof CharacterState;
                                        const baseVal = (currentState[baseKey] as number) || 0;
                                        const modVal = (currentState[modKey] as number) || 0;
                                        const total = baseVal + modVal;
                                        const isPublic = currentState.visibility_settings[stat.key];

                                        return (
                                            <div key={stat.key} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-700">{stat.label}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newSettings = { ...currentState.visibility_settings, [stat.key]: !isPublic };
                                                                setCurrentState({ ...currentState, visibility_settings: newSettings });
                                                            }}
                                                            className="text-gray-400 hover:text-indigo-600 transition"
                                                            title={isPublic ? '読者公開中' : '非公開'}
                                                        >
                                                            {isPublic ? <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">公開</span> : <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">非公開</span>}
                                                        </button>
                                                    </div>
                                                    <span className={`text-xl font-extrabold ${total > 0 ? 'text-indigo-600' : total < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                                        {total}
                                                    </span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">基礎値</label>
                                                        <input
                                                            type="number"
                                                            value={baseVal}
                                                            onChange={e => handleStatChange(baseKey, e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-gray-500 mb-1">補正値</label>
                                                        <input
                                                            type="number"
                                                            value={modVal}
                                                            onChange={e => handleStatChange(modKey, e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                イベントとキャラクターを選択してください
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
