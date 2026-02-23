import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Character, type CustomAttribute, type Job, type Skill, type Equipment } from '../../api';
import { ArrowLeft, Plus, Trash2, Save, Check, Copy, User, Swords, PlusCircle, X } from 'lucide-react';

const STAT_LABELS: Record<string, string> = {
    hp: 'HP', mp: 'MP', str: '筋力', mag: '魔力', spd: '敏捷', luk: '運'
};
const STAT_KEYS = Object.keys(STAT_LABELS);

export default function CharacterDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'profile' | 'status'>('profile');

    const [character, setCharacter] = useState<Character | null>(null);
    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // For new custom attribute
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState('');

    const fetchData = async () => {
        try {
            const [charRes, jobsRes, skillsRes, equipsRes] = await Promise.all([
                api.get<Character>(`/characters/${id}`),
                api.get<Job[]>('/jobs/'),
                api.get<Skill[]>('/skills/'),
                api.get<Equipment[]>('/equipments/')
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
        } catch (e) {
            console.error(e);
            navigate('/characters');
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleUpdateBasicInfo = (key: keyof Character, value: any) => {
        if (!character) return;
        setCharacter({ ...character, [key]: value });
    };

    // Calculate dynamic stats
    const computedStats = () => {
        if (!character || !character.is_status_enabled) return null;

        const currentJob = availableJobs.find(j => j.id === character.job_id);
        const level = character.level || 1;

        const finalStats: Record<string, { base: number, final: number, bonusStr: string }> = {};

        STAT_KEYS.forEach(k => {
            const jobBase = currentJob?.base_stats?.[k] || 0;
            const jobGrowth = currentJob?.stat_growth?.[k] || 0;
            const talent = character.talent_bonuses?.[k] || 0;

            const baseStat = jobBase + (jobGrowth * (level - 1)) + talent;

            let flatBonus = 0;
            let percentBonus = 0;

            const allModifiers = [
                ...(character.skills || []).flatMap(s => s.modifiers || []),
                ...(character.equipments || []).flatMap(e => e.modifiers || [])
            ];

            allModifiers.filter(m => m.attribute === k).forEach(m => {
                if (m.type === 'flat') flatBonus += m.value;
                if (m.type === 'percent') percentBonus += m.value;
            });

            const finalVal = Math.floor(baseStat * (1 + percentBonus / 100)) + flatBonus;

            let bonusStr = '';
            if (percentBonus > 0 || flatBonus > 0) {
                bonusStr = ` (基本${baseStat}`;
                if (percentBonus > 0) bonusStr += ` +${percentBonus}%`;
                if (flatBonus > 0) bonusStr += ` +${flatBonus}`;
                bonusStr += ')';
            }
            if (percentBonus < 0 || flatBonus < 0) {
                // handle negative
                bonusStr = ` (基本${baseStat} ${percentBonus ? percentBonus + '%' : ''} ${flatBonus ? flatBonus : ''})`;
            }

            finalStats[k] = { base: baseStat, final: finalVal, bonusStr };
        });

        return finalStats;
    };

    const handleTalentBonusChange = (statKey: string, val: string) => {
        if (!character) return;
        const bonuses = { ...(character.talent_bonuses || {}) };
        bonuses[statKey] = parseInt(val) || 0;
        setCharacter({ ...character, talent_bonuses: bonuses });
    };

    const handleAddSkill = (skillIdStr: string) => {
        if (!character || !skillIdStr) return;
        const skillId = parseInt(skillIdStr);
        if (character.skills.find(s => s.id === skillId)) return; // Already exists
        const skill = availableSkills.find(s => s.id === skillId);
        if (skill) {
            setCharacter({ ...character, skills: [...character.skills, skill] });
        }
    };

    const handleRemoveSkill = (skillId: number) => {
        if (!character) return;
        setCharacter({ ...character, skills: character.skills.filter(s => s.id !== skillId) });
    };

    const handleAddEquipment = (eqIdStr: string) => {
        if (!character || !eqIdStr) return;
        const eqId = parseInt(eqIdStr);
        if (character.equipments.find(e => e.id === eqId)) return; // Already exists
        const eq = availableEquipments.find(e => e.id === eqId);
        if (eq) {
            setCharacter({ ...character, equipments: [...character.equipments, eq] });
        }
    };

    const handleRemoveEquipment = (eqId: number) => {
        if (!character) return;
        setCharacter({ ...character, equipments: character.equipments.filter(e => e.id !== eqId) });
    };

    const handleSaveCharacter = async () => {
        if (!character) return;
        setIsSaving(true);
        try {
            // 1. Save Basic & Status primitive fields
            await api.put(`/characters/${id}`, {
                name: character.name,
                age: character.age,
                gender: character.gender,
                faction: character.faction,
                appearance: character.appearance,
                personality: character.personality,
                memo: character.memo,
                visibility_settings: character.visibility_settings,
                is_status_enabled: character.is_status_enabled,
                job_id: character.job_id,
                level: character.level,
                talent_bonuses: character.talent_bonuses
            });

            // 2. Save Relationships (Skills & Equipments)
            await api.put(`/characters/${id}/relationships`, {
                skill_ids: character.skills.map(s => s.id),
                equipment_ids: character.equipments.map(e => e.id)
            });

            // Refresh to get potentially computed Job data etc.
            await fetchData();

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    };

    const handleAddAttribute = async () => {
        if (!newAttrName.trim()) return;
        try {
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
        try {
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

    const basicFields = [
        { key: 'age', label: '年齢' },
        { key: 'gender', label: '性別' },
        { key: 'faction', label: '陣営' },
        { key: 'appearance', label: '外見', type: 'textarea' },
        { key: 'personality', label: '性格', type: 'textarea' },
        { key: 'memo', label: 'メモ', type: 'textarea' },
    ];

    const generatePreviewText = () => {
        if (!character) return '';
        let text = `【${character.name}】\n`;
        basicFields.forEach(field => {
            const val = (character as any)[field.key];
            if (val) text += `・${field.label}: ${val}\n`;
        });
        if (character.attributes.length > 0) {
            text += `\n[追加情報]\n`;
            character.attributes.forEach(a => {
                if (a.attribute_value) text += `・${a.attribute_name}: ${a.attribute_value}\n`;
            });
        }
        if (character.is_status_enabled) {
            const stats = computedStats();
            if (stats) {
                text += `\n[ステータス]\n`;
                const jName = availableJobs.find(j => j.id === character.job_id)?.name || '未設定';
                text += `ジョブ: ${jName} (Lv.${character.level})\n`;
                STAT_KEYS.forEach(k => {
                    text += `${STAT_LABELS[k]}: ${stats[k].final}\n`;
                });
                if (character.skills.length > 0) {
                    text += `スキル: ${character.skills.map(s => s.name).join(', ')}\n`;
                }
                if (character.equipments.length > 0) {
                    text += `装備: ${character.equipments.map(e => e.name).join(', ')}\n`;
                }
            }
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenExportModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition font-medium"
                    >
                        <Copy size={18} />
                        設定を出力
                    </button>
                    <button
                        onClick={handleSaveCharacter}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition text-white font-medium ${saveSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {saveSuccess ? <Check size={18} /> : <Save size={18} />}
                        {saveSuccess ? '保存しました' : isSaving ? '保存中...' : '変更を保存'}
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
                                {basicFields.map(field => (
                                    <div key={field.key} className="relative group">
                                        <div className="mb-1">
                                            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                                        </div>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={(character as any)[field.key] || ''}
                                                onChange={e => handleUpdateBasicInfo(field.key as any, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={(character as any)[field.key] || ''}
                                                onChange={e => handleUpdateBasicInfo(field.key as any, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-5">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">ジョブ（クラス）</label>
                                                <select
                                                    value={character.job_id || ''}
                                                    onChange={e => handleUpdateBasicInfo('job_id', e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                >
                                                    <option value="">（未設定）</option>
                                                    {availableJobs.map(job => (
                                                        <option key={job.id} value={job.id}>{job.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">レベル</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="999"
                                                    value={character.level}
                                                    onChange={e => handleUpdateBasicInfo('level', parseInt(e.target.value) || 1)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 shadow-inner">
                                            <h4 className="font-bold text-indigo-900 text-sm mb-4 flex items-center justify-between">
                                                <span>最終ステータス</span>
                                                <span className="text-xs font-normal text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">自動計算</span>
                                            </h4>

                                            {(() => {
                                                const stats = computedStats();
                                                if (!stats) return null;
                                                return (
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                        {STAT_KEYS.map(k => (
                                                            <div key={k} className="flex flex-col bg-white px-3 py-2 rounded-lg border border-indigo-100">
                                                                <span className="text-xs font-bold text-gray-500">{STAT_LABELS[k]}</span>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-xl font-mono font-bold text-indigo-700">
                                                                        {stats[k].final}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                                        {stats[k].bonusStr}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <h4 className="font-bold text-gray-700 text-sm mb-3">タレントボーナス (個別補正)</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {STAT_KEYS.map(k => (
                                                    <div key={`talent-${k}`}>
                                                        <label className="block text-xs text-gray-500 mb-1">{STAT_LABELS[k]}</label>
                                                        <input
                                                            type="number"
                                                            value={character.talent_bonuses?.[k] || 0}
                                                            onChange={e => handleTalentBonusChange(k, e.target.value)}
                                                            className="w-full border border-gray-300 rounded px-2 py-1 outline-none text-sm font-mono"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">※基礎値に直接加算される才能補正です</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Skills */}
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">保有スキル</h4>
                                            <div className="flex items-center gap-2 mb-3">
                                                <select id="skill-add-select" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                                                    <option value="">追加するスキルを選択...</option>
                                                    {availableSkills.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById('skill-add-select') as HTMLSelectElement;
                                                        handleAddSkill(el.value);
                                                        el.value = '';
                                                    }}
                                                    className="bg-indigo-50 p-2 rounded text-indigo-600 hover:bg-indigo-100 transition"
                                                >
                                                    <PlusCircle size={20} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {character.skills.map(s => (
                                                    <div key={s.id} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                                                        <span>{s.name}</span>
                                                        <button onClick={() => handleRemoveSkill(s.id)} className="text-indigo-400 hover:text-red-500 transition">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {character.skills.length === 0 && <span className="text-sm text-gray-400 italic">スキルがありません</span>}
                                            </div>
                                        </div>

                                        {/* Equipments */}
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">装備品</h4>
                                            <div className="flex items-center gap-2 mb-3">
                                                <select id="eq-add-select" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                                                    <option value="">追加する装備品を選択...</option>
                                                    {availableEquipments.map(e => (
                                                        <option key={e.id} value={e.id}>[{e.rarity || 'N'}] {e.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById('eq-add-select') as HTMLSelectElement;
                                                        handleAddEquipment(el.value);
                                                        el.value = '';
                                                    }}
                                                    className="bg-indigo-50 p-2 rounded text-indigo-600 hover:bg-indigo-100 transition"
                                                >
                                                    <PlusCircle size={20} />
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {character.equipments.map(eq => (
                                                    <div key={eq.id} className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm flex justify-between items-center group">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-indigo-700">{eq.name}</span>
                                                            <span className="text-[10px] px-1.5 rounded bg-gray-200 text-gray-600">{eq.rarity || 'N'}</span>
                                                        </div>
                                                        <button onClick={() => handleRemoveEquipment(eq.id)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {character.equipments.length === 0 && <span className="text-sm text-gray-400 italic">装備品がありません</span>}
                                            </div>
                                        </div>
                                    </div>
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
