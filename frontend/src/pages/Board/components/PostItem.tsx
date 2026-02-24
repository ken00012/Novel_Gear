import { useState } from 'react';
import { type BoardPost } from '../../../api';
import { Trash2, Edit2, Check, X, CornerLeftUp } from 'lucide-react';

interface PostItemProps {
    post: BoardPost;
    onDelete: () => void;
    onUpdate: (content: string) => void;
    onInsertAbove: (name: string, userIdStr: string, content: string) => void;
}

export default function PostItem({ post, onDelete, onUpdate, onInsertAbove }: PostItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isHovering, setIsHovering] = useState(false);

    const [isInserting, setIsInserting] = useState(false);
    const [insertContent, setInsertContent] = useState('');

    const handleSave = () => {
        onUpdate(editContent);
        setIsEditing(false);
    };

    const handleInsert = () => {
        if (!insertContent) return;
        // 基本的なダミー名で先に挿入させ、後で編集させるか、またはそのまま使う
        onInsertAbove('名無しさん', 'aBcDeFgH', insertContent);
        setIsInserting(false);
        setInsertContent('');
    };

    return (
        <div
            className="flex flex-col gap-1 w-full max-w-4xl"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {isInserting && (
                <div className="ml-8 mb-2 p-3 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-lg flex flex-col gap-2">
                    <div className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                        <CornerLeftUp size={14} /> ここに挿入（名前とIDは仮のものが入ります）
                    </div>
                    <textarea
                        value={insertContent}
                        onChange={e => setInsertContent(e.target.value)}
                        className="w-full border rounded p-2 text-sm focus:outline-none focus:border-indigo-400"
                        rows={2}
                        placeholder="挿入するレス内容を入力"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsInserting(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">キャンセル</button>
                        <button onClick={handleInsert} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded font-medium transition">挿入する</button>
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
                            <button onClick={() => { setIsEditing(true); setEditContent(post.content); }} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="編集">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition" title="削除">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2 mt-2">
                            <textarea
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                className="flex-1 border rounded p-2 text-sm font-sans whitespace-pre-wrap bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                rows={Math.max(3, editContent.split('\n').length)}
                                autoFocus
                            />
                            <div className="flex flex-col gap-1">
                                <button onClick={handleSave} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition" title="保存"><Check size={16} /></button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition" title="キャンセル"><X size={16} /></button>
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
