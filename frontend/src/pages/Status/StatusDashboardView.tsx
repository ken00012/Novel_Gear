import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Event, type Character, type CharacterState, type Job, type Skill, type Equipment } from '../../api';
import { Plus, Trash2, Pencil } from 'lucide-react';
import StatusEditorPane from '../Characters/components/StatusEditorPane';

export default function StatusDashboardView() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<number | null>(null);

    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);

    const [currentState, setCurrentState] = useState<CharacterState | null>(null);

    // New Event Form
    const [showNewEvent, setShowNewEvent] = useState(false);
    const [newChapter, setNewChapter] = useState('');
    const [newEventName, setNewEventName] = useState('');

    // Edit Event Form
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [editChapter, setEditChapter] = useState('');
    const [editEventName, setEditEventName] = useState('');

    const [searchParams] = useSearchParams();

    const fetchEvents = async () => {
        try {
            const res = await api.get<Event[]>('/events/');
            setEvents(res.data);

            const eventIdParam = searchParams.get('eventId');
            if (eventIdParam) {
                const id = parseInt(eventIdParam, 10);
                if (res.data.some(e => e.id === id)) {
                    setSelectedEventId(id);
                    return;
                }
            }

            if (res.data.length > 0 && !selectedEventId) {
                setSelectedEventId(res.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [charRes, jobsRes, skillsRes, equipsRes] = await Promise.all([
                api.get<Character[]>('/characters/'),
                api.get<Job[]>('/jobs/'),
                api.get<Skill[]>('/skills/'),
                api.get<Equipment[]>('/equipments/')
            ]);
            setCharacters(charRes.data);
            setAvailableJobs(jobsRes.data);
            setAvailableSkills(skillsRes.data);
            setAvailableEquipments(equipsRes.data);
            if (charRes.data.length > 0 && !selectedCharId) {
                setSelectedCharId(charRes.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedEventId && selectedCharId) {
            fetchState(selectedEventId, selectedCharId);
        } else {
            setCurrentState(null);
        }
    }, [selectedEventId, selectedCharId]);

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
                    visibility_settings: {},
                    memo: ''
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

    const handleStartEdit = (ev: Event) => {
        setEditingEventId(ev.id);
        setEditChapter(ev.chapter_number);
        setEditEventName(ev.event_name);
    };

    const handleSaveEditEvent = async (ev: Event) => {
        if (editChapter === ev.chapter_number && editEventName === ev.event_name) {
            setEditingEventId(null);
            return;
        }
        try {
            await api.put(`/events/${ev.id}`, {
                chapter_number: editChapter,
                event_name: editEventName,
                order_index: ev.order_index
            });
            setEditingEventId(null);
            await fetchEvents();
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

    // (StatusEditorPane内で保存管理するため削除)

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
                                <div className="pr-16">
                                    {editingEventId === ev.id ? (
                                        <div
                                            className="flex flex-col gap-1"
                                            onClick={e => e.stopPropagation()}
                                            onBlur={e => {
                                                // 親コンテナ外にフォーカスが外れた場合のみ保存（input間の移動は無視）
                                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                                    handleSaveEditEvent(ev);
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveEditEvent(ev);
                                                if (e.key === 'Escape') setEditingEventId(null);
                                            }}
                                        >
                                            <input
                                                value={editChapter}
                                                onChange={e => setEditChapter(e.target.value)}
                                                className="text-xs font-bold text-indigo-600 bg-transparent border-b border-indigo-200 focus:outline-none w-full"
                                                autoFocus
                                            />
                                            <input
                                                value={editEventName}
                                                onChange={e => setEditEventName(e.target.value)}
                                                className="text-sm font-medium text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-xs font-bold text-indigo-600 mb-1">{ev.chapter_number}</div>
                                            <div className="text-sm text-gray-800 font-medium">{ev.event_name}</div>
                                        </>
                                    )}
                                </div>
                                <div className="absolute top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(ev);
                                        }}
                                        className="text-gray-400 hover:text-indigo-600 transition p-1"
                                        title="編集"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteEvent(e, ev.id)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                        title="削除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
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

                    {/* Stat Editor Pane */}
                    <div className="flex-1 max-w-2xl">
                        {selectedEventId && selectedCharId && currentState !== null ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{characters.find(c => c.id === selectedCharId)?.name} のステータス</h3>
                                        <div className="text-sm text-indigo-600 mt-1 font-medium">
                                            {events.find(e => e.id === selectedEventId)?.chapter_number} - {events.find(e => e.id === selectedEventId)?.event_name}
                                        </div>
                                    </div>
                                </div>

                                <StatusEditorPane
                                    character={characters.find(c => c.id === selectedCharId)!}
                                    currentState={currentState}
                                    availableJobs={availableJobs}
                                    availableSkills={availableSkills}
                                    availableEquipments={availableEquipments}
                                    onStateChange={() => fetchState(selectedEventId, selectedCharId)}
                                />
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
