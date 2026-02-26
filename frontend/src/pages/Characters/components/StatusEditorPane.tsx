import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, type Character, type CharacterState, type Job, type Skill, type Equipment, type Event, type Modifier } from '../../../api';
import { Plus, X, Loader2, Check, Copy } from 'lucide-react';
import { useStatusAttributes } from '../../../contexts/StatusContext';

interface Props {
    character: Character;
    currentState: CharacterState | null; // null means 'Initial Settings' (Global Character)
    eventList: Event[];
    availableJobs: Job[];
    availableSkills: Skill[];
    availableEquipments: Equipment[];
    onStateChange: () => void; // Triggered when saved
}
// 共通のステータス＆装備編集コンポーネント
export default function StatusEditorPane({
    character,
    currentState,
    availableJobs,
    availableSkills,
    availableEquipments,
    onStateChange
}: Omit<Props, 'eventList'>) {
    const { statusAttributes } = useStatusAttributes();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const formatModifiersSummary = (modifiers: Modifier[] | undefined) => {
        if (!modifiers || modifiers.length === 0) return '';
        const summaries = modifiers.map(mod => {
            const liveAttr = statusAttributes.find(a => a.key === mod.attribute);
            const name = liveAttr ? liveAttr.name : (mod.attribute_name ? `(削除済：${mod.attribute_name})` : '(不明なステータス)');
            const sign = mod.value > 0 ? '+' : '';
            const unit = mod.type === 'percent' ? '%' : '';
            return `${name} ${sign}${mod.value}${unit}`;
        });
        return `(${summaries.join(', ')})`;
    };

    // Local state for editing. Initialized from either currentState or global character.
    // Use fallback to global character if currentState properties are null/undefined
    const activeLevel = currentState?.level ?? character.level;
    const activeJobId = currentState?.job_id ?? character.job_id ?? null;
    const activeSkills = currentState?.skills ?? character.skills ?? [];
    const activeEquipments = currentState?.equipments ?? character.equipments ?? [];

    const [localLevel, setLocalLevel] = useState(activeLevel);
    const [localJobId, setLocalJobId] = useState<number | null>(activeJobId);

    // Skills/Equipments selection state (just IDs for dropdown)
    const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('');
    const [selectedEqId, setSelectedEqId] = useState<number | ''>('');

    // Update local state when props change (e.g. user switches timeline)
    useEffect(() => {
        setLocalLevel(currentState?.level ?? character.level);
        setLocalJobId(currentState?.job_id ?? character.job_id ?? null);
    }, [currentState, character]);

    // Handle adding skill to active context
    const handleAddSkill = async () => {
        if (!selectedSkillId) return;
        const newSkillIds = [...activeSkills.map((s: Skill) => s.id), Number(selectedSkillId)];
        await saveRelationships(newSkillIds, activeEquipments.map((e: Equipment) => e.id));
        setSelectedSkillId('');
    };

    const handleRemoveSkill = async (skillId: number) => {
        const newSkillIds = activeSkills.map((s: Skill) => s.id).filter((id: number) => id !== skillId);
        await saveRelationships(newSkillIds, activeEquipments.map((e: Equipment) => e.id));
    };

    const handleAddEquipment = async () => {
        if (!selectedEqId) return;
        const newEqIds = [...activeEquipments.map((e: Equipment) => e.id), Number(selectedEqId)];
        await saveRelationships(activeSkills.map((s: Skill) => s.id), newEqIds);
        setSelectedEqId('');
    };

    const handleRemoveEquipment = async (eqId: number) => {
        const newEqIds = activeEquipments.map((e: Equipment) => e.id).filter((id: number) => id !== eqId);
        await saveRelationships(activeSkills.map((s: Skill) => s.id), newEqIds);
    };

    // Save relationships (Skills/Equips) to either Global or State
    const saveRelationships = async (skillIds: number[], equipmentIds: number[]) => {
        setSaveStatus('saving');
        try {
            if (currentState) {
                await api.put(`/characters/${character.id}/states/${currentState.id}/relationships`, {
                    skill_ids: skillIds,
                    equipment_ids: equipmentIds
                });
            } else {
                await api.put(`/characters/${character.id}/relationships`, {
                    skill_ids: skillIds,
                    equipment_ids: equipmentIds
                });
            }
            onStateChange();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('idle');
        }
    };

    // Auto-save debounced effect for level/job changes
    const handleSaveBasic = useCallback(async (level: number, jobId: number | null) => {
        setSaveStatus('saving');
        try {
            if (currentState) {
                await api.post(`/characters/${character.id}/states/`, {
                    ...currentState,
                    level: level,
                    job_id: jobId
                });
            } else {
                await api.put(`/characters/${character.id}`, {
                    ...character,
                    level: level,
                    job_id: jobId
                });
            }
            onStateChange();
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setSaveStatus('idle');
        }
    }, [character, currentState, onStateChange]);

    useEffect(() => {
        // Only run save if values actually changed from active
        if (localLevel !== activeLevel || localJobId !== activeJobId) {
            const timer = setTimeout(() => {
                handleSaveBasic(localLevel, localJobId);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [localLevel, localJobId, activeLevel, activeJobId, handleSaveBasic]);


    // Stat changes (Only applicable when currentState is present, but for robust UI we show it anyway)
    const handleStatChange = (key: keyof CharacterState | `talent_${string}`, value: string) => {
        const numValue = parseInt(value, 10);
        const val = isNaN(numValue) ? 0 : numValue;

        if (typeof key === 'string' && key.startsWith('talent_')) {
            // Edit global talent bonus
            if (!currentState) {  // Only allow talent edit in initial settings
                const attr = key.replace('talent_', '');
                const newBonuses = { ...(character.talent_bonuses as Record<string, any>), [attr]: val };
                api.put(`/characters/${character.id}`, { ...character, talent_bonuses: newBonuses }).then(() => onStateChange());
            }
        } else if (currentState) {
            if (key === 'memo') {
                api.post(`/characters/${character.id}/states/`, { ...currentState, memo: value }).then(() => onStateChange());
            } else {
                api.post(`/characters/${character.id}/states/`, { ...currentState, [key]: val }).then(() => onStateChange());
            }
        }
    };

    // Calculate Dynamic Stats
    const computedStats = useMemo(() => {
        const baseVals: Record<string, number> = {};
        const flatMods: Record<string, number> = {};
        const pctMods: Record<string, number> = {};

        statusAttributes.forEach(attr => {
            baseVals[attr.key] = 0;
            flatMods[attr.key] = 0;
            pctMods[attr.key] = 0;
        });

        // 1. Job Bases & Growths
        const job = availableJobs.find(j => j.id === localJobId);
        if (job) {
            statusAttributes.forEach(attr => {
                const b = job.base_stats[attr.key] || 0;
                const g = job.stat_growth[attr.key] || 0;
                baseVals[attr.key] += b + (g * ((localLevel || 1) - 1));
            });
        }

        // 2. Talent Bonuses
        statusAttributes.forEach(attr => {
            baseVals[attr.key] += (character.talent_bonuses[attr.key] || 0);
        });

        // 3. User SP points from currentState
        if (currentState) {
            statusAttributes.forEach(attr => {
                // Read from dynamic JSON first, fallback to legacy columns
                const stateBaseStats = currentState.base_stats || {};
                const dynamicSp = stateBaseStats[attr.key];
                if (dynamicSp !== undefined) {
                    baseVals[attr.key] += dynamicSp;
                } else {
                    const legacyKey = `${attr.key}_base` as keyof CharacterState;
                    baseVals[attr.key] += (currentState[legacyKey] as number) || 0;
                }
            });
        }

        // 4. Modifiers (Skills & Equipments & currentState Flat mods)
        const allItems = [...activeSkills, ...activeEquipments];
        allItems.forEach(item => {
            (item.modifiers || []).forEach((mod: any) => {
                const k = mod.attribute;
                if (flatMods[k] === undefined) return; // not tracking this stat

                if (mod.type === 'flat') flatMods[k] += mod.value;
                if (mod.type === 'percent') pctMods[k] += mod.value;
            });
        });

        if (currentState) {
            statusAttributes.forEach(attr => {
                const stateModStats = currentState.mod_stats || {};
                const dynamicMod = stateModStats[attr.key];
                if (dynamicMod !== undefined) {
                    flatMods[attr.key] += dynamicMod;
                } else {
                    const legacyModKey = `${attr.key}_mod` as keyof CharacterState;
                    flatMods[attr.key] += (currentState[legacyModKey] as number) || 0;
                }
            });
        }

        const finalStats: Record<string, number> = {};
        statusAttributes.forEach(attr => {
            finalStats[attr.key] = Math.floor(baseVals[attr.key] * (1 + pctMods[attr.key] / 100)) + flatMods[attr.key];
        });

        return { finalStats, baseVals, pctMods, flatMods };
    }, [statusAttributes, localJobId, localLevel, character, currentState, availableJobs, activeSkills, activeEquipments]);

    // statFields are now derived dynamically
    const statFields = statusAttributes.map(attr => ({ key: attr.key, label: attr.name }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {currentState ? "イベント固有設定 (選択されたタイムラインのみ上書き)" : "初期設定 (デフォルトの強さ・装備)"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentState ? "初期設定を基準として、このイベントで異なるジョブや装備を持っている場合に変更してください。" : "物語開始時、または特に指定がない場合の基本ステータスです。"}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                    {saveStatus === 'saving' && <span className="flex items-center text-gray-400 gap-1"><Loader2 size={14} className="animate-spin" /> 保存中...</span>}
                    {saveStatus === 'saved' && <span className="flex items-center text-green-600 gap-1"><Check size={14} /> 保存しました</span>}
                </div>
            </div>

            {/* ジョブとレベル */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ジョブ（クラス）</label>
                    <select
                        value={localJobId || ''}
                        onChange={e => setLocalJobId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">なし（または不明）</option>
                        {availableJobs.map(j => (
                            <option key={j.id} value={j.id}>{j.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">レベル</label>
                    <input
                        type="number"
                        min="1"
                        value={localLevel}
                        onChange={e => setLocalLevel(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* スキルと装備 */}
            <div className="flex flex-col gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100 mt-6">
                {/* 装備 */}
                <div className="w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                        <span>装備品</span>
                        <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activeEquipments.length} 個</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                        <select
                            value={selectedEqId}
                            onChange={e => setSelectedEqId(e.target.value === '' ? '' : Number(e.target.value))}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- 追加する装備を選択 --</option>
                            {availableEquipments.filter((eq: Equipment) => !activeEquipments.find((e: Equipment) => e.id === eq.id)).map((eq: Equipment) => (
                                <option key={eq.id} value={eq.id}>{eq.name} {formatModifiersSummary(eq.modifiers)}</option>
                            ))}
                        </select>
                        <button onClick={handleAddEquipment} disabled={!selectedEqId} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {activeEquipments.map((eq: Equipment) => (
                            <div key={eq.id} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm group">
                                <span className="text-sm font-medium text-gray-800">
                                    {eq.name}
                                    {eq.modifiers && eq.modifiers.length > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">{formatModifiersSummary(eq.modifiers)}</span>}
                                </span>
                                <button onClick={() => handleRemoveEquipment(eq.id)} className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {activeEquipments.length === 0 && <p className="text-sm text-gray-400 text-center py-2">装備なし</p>}
                    </div>
                </div>

                {/* スキル */}
                <div className="w-full pt-4 border-t border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                        <span>保有スキル</span>
                        <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activeSkills.length} 個</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                        <select
                            value={selectedSkillId}
                            onChange={e => setSelectedSkillId(e.target.value === '' ? '' : Number(e.target.value))}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- 追加するスキルを選択 --</option>
                            {availableSkills.filter((sk: Skill) => !activeSkills.find((s: Skill) => s.id === sk.id)).map((sk: Skill) => (
                                <option key={sk.id} value={sk.id}>{sk.name} {formatModifiersSummary(sk.modifiers)}</option>
                            ))}
                        </select>
                        <button onClick={handleAddSkill} disabled={!selectedSkillId} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {activeSkills.map((sk: Skill) => (
                            <div key={sk.id} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm group">
                                <div>
                                    <div className="text-sm font-medium text-gray-800">
                                        {sk.name}
                                        {sk.modifiers && sk.modifiers.length > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">{formatModifiersSummary(sk.modifiers)}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveSkill(sk.id)} className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {activeSkills.length === 0 && <p className="text-sm text-gray-400 text-center py-2">スキルなし</p>}
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* ステータス数値エディタ */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">最終ステータス</h4>
                    <button
                        onClick={() => {
                            let text = `【${character.name} のステータス】\n(Lv.${localLevel} ${availableJobs.find(j => j.id === localJobId)?.name || ''})\n`;
                            statFields.forEach(stat => {
                                text += `・${stat.label}: ${computedStats.finalStats[stat.key as keyof typeof computedStats.finalStats]}\n`;
                            });
                            navigator.clipboard.writeText(text).then(() => alert('コピーしました'));
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                    >
                        <Copy size={14} /> パラメータをコピー
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {statFields.map(stat => (
                        <div key={stat.key} className="bg-white border rounded-lg p-3 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-600 text-sm">{stat.label}</span>
                                <span className={`text-xl font-extrabold ${computedStats.finalStats[stat.key as keyof typeof computedStats.finalStats] > 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
                                    {computedStats.finalStats[stat.key as keyof typeof computedStats.finalStats]}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 space-y-0.5 mt-2">
                                <div className="flex justify-between">
                                    <span>基準値 (Job/Lv):</span>
                                    <span>{computedStats.baseVals[stat.key as keyof typeof computedStats.baseVals]}</span>
                                </div>
                                <div className="flex justify-between text-indigo-400">
                                    <span>乗算補正:</span>
                                    <span>{computedStats.pctMods[stat.key as keyof typeof computedStats.pctMods]}%</span>
                                </div>
                                <div className="flex justify-between text-indigo-500">
                                    <span>加算補正 (装備等):</span>
                                    <span>+{computedStats.flatMods[stat.key as keyof typeof computedStats.flatMods]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional detailed inputs */}
                {!currentState ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-3">才能ボーナス (才能による初期値の底上げ)</h5>
                        <div className="grid grid-cols-3 gap-3">
                            {statFields.map(stat => (
                                <div key={`talent_${stat.key}`}>
                                    <label className="block text-xs text-gray-500 mb-1">{stat.label} ボーナス</label>
                                    <input
                                        type="number"
                                        value={character.talent_bonuses[stat.key as keyof typeof character.talent_bonuses] || 0}
                                        onChange={e => handleStatChange(`talent_${stat.key}` as any, e.target.value)}
                                        onBlur={() => {
                                            // Ensure re-render by doing manual save if needed on blur
                                        }}
                                        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-3">イベント固有のステータス加減算 (バフ/デバフ/SP割り振り)</h5>
                        <div className="grid grid-cols-2 gap-4">
                            {statFields.map(stat => {
                                const currentBaseStats = currentState.base_stats || {};
                                const currentModStats = currentState.mod_stats || {};

                                const baseVal = currentBaseStats[stat.key] !== undefined ? currentBaseStats[stat.key] : (currentState[`${stat.key}_base` as keyof CharacterState] as number || 0);
                                const modVal = currentModStats[stat.key] !== undefined ? currentModStats[stat.key] : (currentState[`${stat.key}_mod` as keyof CharacterState] as number || 0);
                                return (
                                    <div key={`state_${stat.key}`} className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">{stat.label} 基礎SP</label>
                                            <input
                                                type="number"
                                                value={baseVal}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const updatedBaseStats = { ...currentBaseStats, [stat.key]: val };
                                                    api.post(`/characters/${character.id}/states/`, { ...currentState, base_stats: updatedBaseStats }).then(() => onStateChange());
                                                }}
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">{stat.label} 特殊固定補正</label>
                                            <input
                                                type="number"
                                                value={modVal}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const updatedModStats = { ...currentModStats, [stat.key]: val };
                                                    api.post(`/characters/${character.id}/states/`, { ...currentState, mod_stats: updatedModStats }).then(() => onStateChange());
                                                }}
                                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Memo (Only for currentState) */}
            {currentState && (
                <div className="mt-8">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">プロフィールの変化・メモ</h4>
                    <textarea
                        value={currentState.memo || ''}
                        onChange={e => {
                            // Fast real-time update logic without deep full save, implement simple debounce if needed,
                            // For simplicity doing immediate or onBlur is better for text
                            api.post(`/characters/${character.id}/states/`, { ...currentState, memo: e.target.value }).then(() => onStateChange());
                        }}
                        placeholder="例：このエピソードで「魔王軍四天王」の称号を得た。レベルが10上がった。重傷を負って一時的に戦闘力が低下中、など"
                        className="w-full h-24 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                    />
                    <p className="text-xs text-gray-400 mt-2">※ここに入力した内容は、このイベント（タイムライン）限定のキャラクター状態として保存されます。</p>
                </div>
            )}
            {!currentState && (
                <p className="text-xs text-center text-gray-400 mt-4">初期設定にはイベントメモはありません。タイムラインを選択して入力してください。</p>
            )}

        </div>
    );
}
