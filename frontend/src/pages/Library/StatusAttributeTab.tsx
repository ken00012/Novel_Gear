import { useState, useEffect } from 'react';
import { api, type StatusAttribute } from '../../api';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { useStatusAttributes } from '../../contexts/StatusContext';
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

interface SortableStatusItemProps {
    attr: StatusAttribute;
    editingId: number | null;
    editItem: Partial<StatusAttribute>;
    setEditItem: (val: Partial<StatusAttribute>) => void;
    setEditingId: (id: number | null) => void;
    handleUpdate: (id: number) => void;
    handleDelete: (id: number) => void;
    disabled?: boolean;
}

function SortableStatusItem({ attr, editingId, editItem, setEditItem, setEditingId, handleUpdate, handleDelete, disabled }: SortableStatusItemProps) {
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
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                                value={editItem.name || ''}
                                onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="表示名"
                            />
                            <input
                                value={editItem.description || ''}
                                onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="説明"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={editItem.is_active}
                                    onChange={e => setEditItem({ ...editItem, is_active: e.target.checked })}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                /> 有効化
                            </label>
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
                            {attr.name} <span className="text-sm font-normal text-gray-500 ml-2">{attr.description || <span className="italic text-gray-300">説明なし</span>}</span>
                        </div>
                        <div className="w-24 flex justify-center">
                            {attr.is_active ?
                                <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium">有効</span> :
                                <span className="px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded text-xs font-medium">無効</span>}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
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
        </div>
    );
}

export default function StatusAttributeTab() {
    const { refresh } = useStatusAttributes();
    const [attributes, setAttributes] = useState<StatusAttribute[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newItem, setNewItem] = useState<Partial<StatusAttribute>>({ name: '', description: '', is_active: true });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editItem, setEditItem] = useState<Partial<StatusAttribute>>({});

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchAttributes = async () => {
        try {
            const res = await api.get<StatusAttribute[]>('/status_attributes/');
            setAttributes(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    const handleCreate = async () => {
        try {
            const count = attributes.length;
            await api.post('/status_attributes/', { ...newItem, order_index: count + 1 });
            setNewItem({ name: '', description: '', is_active: true });
            setIsCreating(false);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editItem.name) return;
        try {
            await api.put(`/status_attributes/${id}`, editItem);
            setEditingId(null);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このステータス項目を削除しますか？\n（すでに割り当てられているデータに影響が出る可能性があります）')) return;
        try {
            await api.delete(`/status_attributes/${id}`);
            fetchAttributes();
            refresh();
        } catch (e) {
            console.error(e);
        }
    };

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

            setAttributes(newOrder as StatusAttribute[]);

            try {
                const updates = newOrder.map(attr => ({
                    id: attr.id,
                    order_index: attr.order_index
                }));
                await api.put('/status_attributes/reorder', updates);
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
                <div className="flex items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">ステータス項目定義</h3>
                        <p className="text-sm text-gray-500 mt-1">ゲームや世界観に合わせた独自のステータス項目（HP, 筋力, 魅力など）を定義します。</p>
                    </div>
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
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex flex-col gap-3">
                        <h4 className="font-bold text-indigo-800 text-sm">新規項目の追加</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">表示名 (例: 体力, 筋力)</label>
                                <input
                                    value={newItem.name || ''}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full text-sm p-2 border rounded focus:ring-1 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">説明 (任意)</label>
                                <input
                                    value={newItem.description || ''}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full text-sm p-2 border rounded focus:ring-1 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsCreating(false)} className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded transition">キャンセル</button>
                            <button onClick={handleCreate} disabled={!newItem.name} className="px-4 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded transition">追加する</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-2">
                            <SortableContext
                                items={attributes.map(a => a.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {attributes.map(attr => (
                                    <SortableStatusItem
                                        key={attr.id}
                                        attr={attr}
                                        editingId={editingId}
                                        editItem={editItem}
                                        setEditItem={setEditItem}
                                        setEditingId={setEditingId}
                                        handleUpdate={handleUpdate}
                                        handleDelete={handleDelete}
                                        disabled={isReordering}
                                    />
                                ))}
                            </SortableContext>
                            {attributes.length === 0 && !isCreating && (
                                <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                    ステータス項目が登録されていません。右上から追加してください。
                                </div>
                            )}
                        </div>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
