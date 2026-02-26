import { useState, useEffect } from 'react';
import { type BoardPost, type BoardNamePreset } from '../../../api';
import { Trash2, Edit2, Check, X, CornerLeftUp, RefreshCw } from 'lucide-react';

interface PostItemProps {
    post: BoardPost;
    namePresets: BoardNamePreset[];
    onDelete: () => void;
    onUpdate: (newName: string, content: string) => void;
    onInsertAbove: (name: string, userIdStr: string, content: string) => void;
}

export default function PostItem({ post, namePresets, onDelete, onUpdate, onInsertAbove }: PostItemProps) {
    const [isEditing, setIsEditing] = useState(false);

    // Edit state for multiple fields
    const [editName, setEditName] = useState(post.name);
    const [editContent, setEditContent] = useState(post.content);

    const [isHovering, setIsHovering] = useState(false);

    const [isInserting, setIsInserting] = useState(false);
    const [insertContent, setInsertContent] = useState('');
    const [insertName, setInsertName] = useState('名無しさん');
    const [insertIdStr, setInsertIdStr] = useState('');
    const [isIdFixed, setIsIdFixed] = useState(false);

    const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setInsertIdStr(result);
    };

    useEffect(() => {
        if (isInserting && !insertIdStr) generateId();
    }, [isInserting]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectPreset = (preset: BoardNamePreset) => {
        setInsertName(preset.name);
        if (preset.user_id_str) {
            setInsertIdStr(preset.user_id_str);
            setIsIdFixed(true);
        } else {
            generateId();
            setIsIdFixed(false);
        }
    };

    const handleSave = () => {
        onUpdate(editName, editContent);
        setIsEditing(false);
    };

    const handleInsert = () => {
        if (!insertContent || !insertName) return;
        onInsertAbove(insertName, insertIdStr, insertContent);
        setIsInserting(false);
        setInsertContent('');
        if (!isIdFixed) generateId();
    };

    return (
        <div
            className="flex flex-col gap-1 w-full max-w-4xl"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {isInserting && (
                <div className="ml-8 mb-2 p-3 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-lg flex flex-col gap-2">
                    <div className="text-xs font-bold text-indigo-500 flex items-center gap-1 mb-1">
                        <CornerLeftUp size={14} /> ここに挿入
                    </div>
                    {/* Name Library */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-1">
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">名前ライブラリ:</span>
                        {namePresets.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handleSelectPreset(preset)}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium transition whitespace-nowrap border border-indigo-200"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-1">
                        <div className="flex items-center border rounded bg-white px-2 py-1 w-1/3">
                            <span className="text-xs text-gray-400 font-bold mr-2 w-8">名前</span>
                            <input
                                value={insertName}
                                onChange={e => setInsertName(e.target.value)}
                                className="bg-transparent w-full text-xs outline-none font-medium"
                                placeholder="名無しさん"
                            />
                        </div>
                        <div className="flex items-center border rounded bg-white px-2 py-1 w-2/3">
                            <span className="text-xs text-gray-400 font-bold mr-2 w-6">ID</span>
                            <input
                                value={insertIdStr}
                                onChange={e => setInsertIdStr(e.target.value)}
                                className="bg-transparent w-full text-xs outline-none font-mono"
                            />
                            <button onClick={generateId} className="text-gray-400 hover:text-indigo-600 transition ml-1" title="IDを再生成">
                                <RefreshCw size={12} />
                            </button>
                            <div className="h-3 border-l border-gray-300 mx-2"></div>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isIdFixed}
                                    onChange={e => setIsIdFixed(e.target.checked)}
                                    className="w-3 h-3 text-indigo-600 rounded border-gray-300"
                                />
                                <span className="text-xs font-bold text-gray-500">固定</span>
                            </label>
                        </div>
                    </div>

                    <textarea
                        value={insertContent}
                        onChange={e => setInsertContent(e.target.value)}
                        className="w-full border rounded p-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                        rows={2}
                        placeholder="挿入するレス内容を入力"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsInserting(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">キャンセル</button>
                        <button onClick={handleInsert} disabled={!insertName || !insertContent} className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3 py-1 rounded font-medium transition shadow-sm">挿入する</button>
                    </div>
                </div>
            )}

            <div className="flex gap-2 group">
                <div className="text-sm font-bold text-gray-500 w-8 text-right shrink-0 pt-0.5 mt-2">
                    {post.number}:
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:border-indigo-200 transition">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-emerald-800 text-sm">{post.name}</span>
                            <span className="text-xs text-gray-400 font-mono">ID:{post.user_id_str}</span>
                        </div>

                        <div className={`flex gap-1 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                            <button onClick={() => setIsInserting(!isInserting)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="この上に挿入">
                                <CornerLeftUp size={14} />
                            </button>
                            <button onClick={() => {
                                setIsEditing(true);
                                setEditContent(post.content);
                                setEditName(post.name);
                            }} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="編集">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition" title="削除">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-2 bg-gray-50 p-2 rounded border">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-gray-500">レス番:</span>
                                <span className="w-12 p-1 text-xs text-gray-500 bg-gray-100 rounded border border-transparent font-mono text-center">{post.number}</span>
                                <span className="text-xs font-bold text-gray-500 ml-2">名前:</span>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="flex-1 max-w-[200px] border rounded p-1 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <textarea
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    className="flex-1 border rounded p-2 text-sm font-sans whitespace-pre-wrap focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                    rows={Math.max(3, editContent.split('\n').length)}
                                    autoFocus
                                />
                                <div className="flex flex-col gap-1">
                                    <button onClick={handleSave} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm" title="保存"><Check size={16} /></button>
                                    <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition shadow-sm" title="キャンセル"><X size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">{post.content}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
