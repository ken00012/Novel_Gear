import { useState, useEffect } from 'react';
import { api, type CharacterProfileAttribute } from '../../api';
import { Plus, Trash2, Edit2, Check, X, Tag as TagIcon, GripVertical } from 'lucide-react';
import { useProfileAttributes } from '../../contexts/ProfileContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableProfileItemProps {
    attr: CharacterProfileAttribute;
    editingId: number | null;
    editItem: Partial<CharacterProfileAttribute>;
    setEditItem: (val: Partial<CharacterProfileAttribute>) => void;
    setEditingId: (id: number | null) => void;
    handleUpdate: (id: number) => void;
    handleDelete: (id: number) => void;
    managingTagsFor: CharacterProfileAttribute | null;
    setManagingTagsFor: (val: CharacterProfileAttribute | null) => void;
    newTagName: string;
    setNewTagName: (val: string) => void;
    handleAddTag: () => void;
    handleDeleteTag: (id: number) => void;
    disabled?: boolean;
}

function SortableProfileItem({
    attr, editingId, editItem, setEditItem, setEditingId,
    handleUpdate, handleDelete, managingTagsFor, setManagingTagsFor,
    newTagName, setNewTagName, handleAddTag, handleDeleteTag, disabled
}: SortableProfileItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: attr.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow transition group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="p-4 flex items-center gap-4">
                <div {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab p-1 outline-none">
                    <GripVertical size={16} />
                </div>
                {editingId === attr.id ? (
                    <>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={editItem.name || ''}
                                onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="w-48 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded border border-gray-200 cursor-not-allowed">
                            {attr.type === 'text' ? 'テキスト入力' : 'タグ選択'} (変更不可)
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleUpdate(attr.id)} className="bg-green-600 text-white p-2 rounded hover:bg-green-700" title="保存">
                                <Check size={18} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-600 p-2 rounded hover:bg-gray-300" title="キャンセル">
                                <X size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 font-bold text-gray-800 text-lg">
                            {attr.name}
                        </div>
                        <div className="w-32 flex justify-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${attr.type === 'tag' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {attr.type === 'text' ? 'テキスト' : 'タグ選択'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {attr.type === 'tag' && (
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setManagingTagsFor(managingTagsFor?.id === attr.id ? null : attr); }}
                                    className={`p-2 rounded transition flex items-center gap-1 text-sm ${managingTagsFor?.id === attr.id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                                    title="タグ管理"
                                >
                                    <TagIcon size={16} /> タグ管理 ({attr.tags?.length || 0})
                                </button>
                            )}
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEditingId(attr.id); setEditItem(attr); }} className="text-gray-400 hover:text-indigo-600 p-2 transition">
                                <Edit2 size={16} />
                            </button>
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleDelete(attr.id); }} className="text-gray-400 hover:text-red-500 p-2 transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Tags Management Panel (Accordion) */}
            {managingTagsFor?.id === attr.id && attr.type === 'tag' && (
                <div className="border-t border-gray-100 bg-gray-50 p-4" onPointerDown={(e) => e.stopPropagation()}>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <TagIcon size={14} className="text-purple-500" />
                        「{attr.name}」のタグ選択肢
                    </h4>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {attr.tags?.map(tag => (
                            <div key={tag.id} className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 text-sm">
                                <span>{tag.name}</span>
                                <button onClick={() => handleDeleteTag(tag.id)} className="text-gray-300 hover:text-red-500 focus:outline-none ml-1">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {(!attr.tags || attr.tags.length === 0) && (
                            <span className="text-xs text-gray-400">タグが登録されていません</span>
                        )}
                    </div>

                    <div className="flex w-full max-w-sm gap-2">
                        <input
                            type="text"
                            placeholder="新しいタグ名を追加..."
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                            onClick={handleAddTag}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition"
                        >
                            追加
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProfileAttributeTab() {
    const { refresh } = useProfileAttributes();
    const [attributes, setAttributes] = useState<CharacterProfileAttribute[]>([]);

    // Attribute editing state
    const [isCreating, setIsCreating] = useState(false);
    const [newItem, setNewItem] = useState<Partial<CharacterProfileAttribute>>({ name: '', type: 'text' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editItem, setEditItem] = useState<Partial<CharacterProfileAttribute>>({});

    // Tag management state
    const [managingTagsFor, setManagingTagsFor] = useState<CharacterProfileAttribute | null>(null);
    const [newTagName, setNewTagName] = useState('');

    const fetchAttributes = async () => {
        try {
            const res = await api.get<CharacterProfileAttribute[]>('/profile_attributes/');
            setAttributes(res.data);

            // Update managingTagsFor if it's currently open
            if (managingTagsFor) {
                const updated = res.data.find(a => a.id === managingTagsFor.id);
                if (updated) setManagingTagsFor(updated);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    // --- Attributes CRUD ---
    const handleCreate = async () => {
        if (!newItem.name?.trim()) return;
        try {
            const count = attributes.length;
            await api.post('/profile_attributes/', { ...newItem, order_index: count + 1 });
            setNewItem({ name: '', type: 'text' });
            setIsCreating(false);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editItem.name?.trim()) return;
        try {
            await api.put(`/profile_attributes/${id}`, editItem);
            setEditingId(null);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このプロフィール項目を削除しますか？\n（関連するキャラクターデータやタグも削除されます）')) return;
        try {
            await api.delete(`/profile_attributes/${id}`);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    // --- Tags CRUD ---
    const handleAddTag = async () => {
        if (!newTagName.trim() || !managingTagsFor) return;
        try {
            await api.post(`/profile_attributes/${managingTagsFor.id}/tags/`, {
                name: newTagName,
            });
            setNewTagName('');
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        if (!confirm('このタグを削除しますか？\n（キャラクターに設定されているデータは文字列として残ります）')) return;
        try {
            await api.delete(`/tags/${tagId}`);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [isReordering, setIsReordering] = useState(false);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setIsReordering(true);
            const oldIndex = attributes.findIndex(a => a.id === active.id);
            const newIndex = attributes.findIndex(a => a.id === over.id);

            const newOrder = arrayMove(attributes, oldIndex, newIndex).map((attr, index) => ({
                ...attr,
                order_index: index
            }));

            setAttributes(newOrder as CharacterProfileAttribute[]);

            try {
                const updates = newOrder.map(attr => ({
                    id: attr.id,
                    order_index: attr.order_index
                }));
                await api.put('/profile_attributes/reorder', updates);
                refresh();
            } catch (e) {
                console.error(e);
                fetchAttributes(); // revert on error
            } finally {
                setIsReordering(false);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <UserIcon className="text-indigo-600" />
                        プロフィール項目定義
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">キャラクターのプロフィール（年齢、種族、陣営など）の入力項目をカスタマイズします。</p>
                </div>
                <div className="flex items-center gap-4">
                    {isReordering && (
                        <div className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full animate-pulse border border-indigo-100">
                            並べ替えを保存中...
                        </div>
                    )}
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            disabled={isReordering}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                        >
                            <Plus size={18} /> 新規項目追加
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {isCreating && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 shadow-sm flex items-center gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="表示名 (例: 種族、出身地)"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="w-48">
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value as 'text' | 'tag' })}
                                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="text">テキスト入力</option>
                                <option value="tag">タグ選択</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition" title="保存">
                                <Check size={18} />
                            </button>
                            <button onClick={() => setIsCreating(false)} className="bg-gray-200 text-gray-600 p-2 rounded hover:bg-gray-300 transition" title="キャンセル">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={attributes.map(a => a.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {attributes.map(attr => (
                                <SortableProfileItem
                                    key={attr.id}
                                    attr={attr}
                                    editingId={editingId}
                                    editItem={editItem}
                                    setEditItem={setEditItem}
                                    setEditingId={setEditingId}
                                    handleUpdate={handleUpdate}
                                    handleDelete={handleDelete}
                                    managingTagsFor={managingTagsFor}
                                    setManagingTagsFor={setManagingTagsFor}
                                    newTagName={newTagName}
                                    setNewTagName={setNewTagName}
                                    handleAddTag={handleAddTag}
                                    handleDeleteTag={handleDeleteTag}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {attributes.length === 0 && !isCreating && (
                        <div className="text-center py-12 text-gray-400">
                            プロフィール項目が定義されていません。「新規項目追加」から設定を作成してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// UserIcon local component
function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
