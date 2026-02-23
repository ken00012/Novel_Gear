import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Character, type CustomAttribute } from '../../api';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Save, Check, Copy } from 'lucide-react';

export default function CharacterDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [character, setCharacter] = useState<Character | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // For new custom attribute
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');

    const fetchCharacter = async () => {
        try {
            const res = await api.get<Character>(`/characters/${id}`);
            setCharacter(res.data);
        } catch (e) {
            console.error(e);
            navigate('/characters');
        }
    };

    useEffect(() => {
        fetchCharacter();
    }, [id]);

    const handleUpdateBasicInfo = (key: keyof Character, value: any) => {
        if (!character) return;
        setCharacter({ ...character, [key]: value });
    };

    const handleToggleBasicVisibility = (key: string) => {
        if (!character) return;
        const settings = { ...character.visibility_settings };
        settings[key] = !settings[key];
        setCharacter({ ...character, visibility_settings: settings });
    };

    const handleSaveCharacter = async () => {
        if (!character) return;
        setIsSaving(true);
        try {
            await api.put(`/characters/${id}`, {
                name: character.name,
                age: character.age,
                gender: character.gender,
                faction: character.faction,
                appearance: character.appearance,
                personality: character.personality,
                memo: character.memo,
                visibility_settings: character.visibility_settings
            });
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
            fetchCharacter();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAttribute = async (attrId: number) => {
        try {
            await api.delete(`/attributes/${attrId}`);
            fetchCharacter();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleAttrVisibility = async (attr: CustomAttribute) => {
        try {
            await api.put(`/attributes/${attr.id}`, {
                attribute_name: attr.attribute_name,
                attribute_value: attr.attribute_value,
                is_public: !attr.is_public
            });
            fetchCharacter();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateAttrValue = async (attr: CustomAttribute, newValue: string) => {
        try {
            await api.put(`/attributes/${attr.id}`, {
                attribute_name: attr.attribute_name,
                attribute_value: newValue,
                is_public: attr.is_public
            });
            fetchCharacter();
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

    const handleExportPublicData = () => {
        if (!character) return;

        let text = `【${character.name}】\n`;

        // Basic fields
        basicFields.forEach(field => {
            if (character.visibility_settings[field.key]) {
                const val = (character as any)[field.key];
                if (val) text += `・${field.label}: ${val}\n`;
            }
        });

        // Custom Attributes
        const publicAttrs = character.attributes.filter(a => a.is_public);
        if (publicAttrs.length > 0) {
            text += `\n[追加情報]\n`;
            publicAttrs.forEach(a => {
                if (a.attribute_value) text += `・${a.attribute_name}: ${a.attribute_value}\n`;
            });
        }

        // copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('公開用データをクリップボードにコピーしました！');
        });
    };

    if (!character) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/characters')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition"
            >
                <ArrowLeft size={16} /> キャラクター一覧に戻る
            </button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
                        {character.name} <span className="text-gray-400 text-lg font-normal ml-2">詳細編集</span>
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPublicData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition font-medium"
                    >
                        <Copy size={18} />
                        公開用テキストをコピー
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
                        基本情報
                    </h3>
                    <div className="space-y-5">
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
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                                    <button
                                        onClick={() => handleToggleBasicVisibility(field.key)}
                                        className="text-gray-400 hover:text-indigo-600 transition"
                                        title={character.visibility_settings[field.key] ? '読者公開中' : '非公開'}
                                    >
                                        {character.visibility_settings[field.key] ? <Eye size={16} className="text-indigo-600" /> : <EyeOff size={16} />}
                                    </button>
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
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-2">
                        追加属性
                    </h3>

                    <div className="space-y-4 mb-8">
                        {character.attributes.map(attr => (
                            <div key={attr.id} className="flex gap-2 items-start border border-gray-100 p-3 rounded-lg bg-gray-50 group">
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase">{attr.attribute_name}</span>
                                        <button
                                            onClick={() => handleToggleAttrVisibility(attr)}
                                            className="text-gray-400 hover:text-indigo-600 transition"
                                            title={attr.is_public ? '読者公開中' : '非公開'}
                                        >
                                            {attr.is_public ? <Eye size={14} className="text-indigo-600" /> : <EyeOff size={14} />}
                                        </button>
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
                                    title="削除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {character.attributes.length === 0 && (
                            <p className="text-sm text-gray-500 italic text-center py-4">
                                追加属性はありません。（例：誕生日、好きな食べ物 など）
                            </p>
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-sm transition shrink-0"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
