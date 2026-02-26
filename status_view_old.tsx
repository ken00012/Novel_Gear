import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type Event, type Character, type CharacterState, type Job, type Skill, type Equipment } from '../../api';
import { Plus, Trash2, Pencil } from 'lucide-react';
import StatusEditorPane from '../Characters/components/StatusEditorPane';
import CreateItemForm from '../../components/common/CreateItemForm';

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

    // Edit Event Form
    const [editingEventId, setEditingEventId] = useState<number | null>(null);

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
                    base_stats: {}, mod_stats: {},
                    visibility_settings: {},
                    memo: ''
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddEvent = async (chapter: string, name: string) => {
        if (!name.trim()) return;
        try {
            const res = await api.post<Event>('/events/', {
                chapter_number: chapter,
                event_name: name,
                order_index: events.length
            });
            setShowNewEvent(false);
            await fetchEvents();
            setSelectedEventId(res.data.id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveEditEvent = async (ev: Event, chapter: string, name: string) => {
        if (chapter === ev.chapter_number && name === ev.event_name) {
            setEditingEventId(null);
            return;
        }
        try {
            await api.put(`/events/${ev.id}`, {
                chapter_number: chapter,
                event_name: name,
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
        if (!window.confirm('縺薙・繧､繝吶Φ繝医ｒ蜑企勁縺励∪縺吶°・歃n窶ｻ髢｢騾｣縺吶ｋ蜷・く繝｣繝ｩ繧ｯ繧ｿ繝ｼ縺ｮ繧ｹ繝・・繧ｿ繧ｹ諠・ｱ繧ょ､ｱ繧上ｌ縺ｾ縺吶・)) return;
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

    // (StatusEditorPane蜀・〒菫晏ｭ倡ｮ｡逅・☆繧九◆繧∝炎髯､)

    return (
        <div className="flex h-full bg-gray-50 border-t border-gray-200">
            {/* Timeline Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">繧ｿ繧､繝繝ｩ繧､繝ｳ</h3>
                    <button
                        onClick={() => setShowNewEvent(!showNewEvent)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {showNewEvent && (
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <CreateItemForm
                            chapterLabel="遶逡ｪ蜿ｷ"
                            chapterPlaceholder="萓・ 隨ｬ1隧ｱ"
                            titleLabel="繧､繝吶Φ繝亥錐"
                            titlePlaceholder="萓・ 鬲皮視險惹ｼ仙ｾ・
                            onSubmit={handleAddEvent}
                            onCancel={() => setShowNewEvent(false)}
                            submitLabel="霑ｽ蜉"
                        />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {events.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">繧､繝吶Φ繝医′縺ゅｊ縺ｾ縺帙ｓ</p>
                    ) : (
                        events.map(ev => (
                            editingEventId === ev.id ? (
                                <CreateItemForm
                                    key={ev.id}
                                    chapterLabel="遶逡ｪ蜿ｷ"
                                    chapterPlaceholder="萓・ 隨ｬ1隧ｱ"
                                    titleLabel="繧､繝吶Φ繝亥錐"
                                    titlePlaceholder="萓・ 鬲皮視險惹ｼ仙ｾ・
                                    initialChapter={ev.chapter_number || ''}
                                    initialTitle={ev.event_name}
                                    onSubmit={(ch, tit) => handleSaveEditEvent(ev, ch, tit)}
                                    onCancel={() => setEditingEventId(null)}
                                    submitLabel="菫晏ｭ・
                                />
                            ) : (
                                <div
                                    key={ev.id}
                                    onClick={() => setSelectedEventId(ev.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition relative group ${selectedEventId === ev.id
                                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="pr-16">
                                        <div className="text-xs font-bold text-indigo-600 mb-1">{ev.chapter_number}</div>
                                        <div className="text-sm text-gray-800 font-medium">{ev.event_name}</div>
                                    </div>
                                    <div className="absolute top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingEventId(ev.id);
                                            }}
                                            className="text-gray-400 hover:text-indigo-600 transition p-1"
                                            title="邱ｨ髮・
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteEvent(e, ev.id)}
                                            className="text-gray-400 hover:text-red-500 transition p-1"
                                            title="蜑企勁"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                    {/* Character Selector */}
                    <div className="w-1/3 max-w-xs space-y-2">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">蟇ｾ雎｡繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ</h4>
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
                                        <h3 className="text-xl font-bold text-gray-900">{characters.find(c => c.id === selectedCharId)?.name} 縺ｮ繧ｹ繝・・繧ｿ繧ｹ</h3>
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
                                繧､繝吶Φ繝医→繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧帝∈謚槭＠縺ｦ縺上□縺輔＞
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
