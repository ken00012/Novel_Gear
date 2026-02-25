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

interface SortableRowProps {
    attr: StatusAttribute;
    editingId: number | null;
    editItem: Partial<StatusAttribute>;
    setEditItem: (val: Partial<StatusAttribute>) => void;
    setEditingId: (id: number | null) => void;
    handleUpdate: (id: number) => void;
    handleDelete: (id: number) => void;
}

function SortableRow({ attr, editingId, editItem, setEditItem, setEditingId, handleUpdate, handleDelete }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: attr.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="border-b last:border-b-0 transition group bg-white">
            <td className="p-3 text-gray-300 hover:text-gray-500 cursor-grab">
                <div {...attributes} {...listeners} className="p-1 inline-block outline-none">
                    <GripVertical size={16} />
                </div>
            </td>
            {editingId === attr.id ? (
                <>
                    <td className="p-3">
                        <input value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} className="w-full p-1 border rounded text-sm" />
                    </td>
                    <td className="p-3">
                        <input value={editItem.description || ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} className="w-full p-1 border rounded text-sm" />
                    </td>
                    <td className="p-3 text-center">
                        <input type="checkbox" checked={editItem.is_active} onChange={e => setEditItem({ ...editItem, is_active: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleUpdate(attr.id)} className="text-green-600 hover:text-green-800"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td className="p-3 font-bold text-gray-800">{attr.name}</td>
                    <td className="p-3 text-gray-500">{attr.description || <span className="text-gray-300 italic">なし</span>}</td>
                    <td className="p-3 text-center">
                        {attr.is_active ?
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">有効</span> :
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs box-border">無効</span>}
                    </td>
                    <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setEditingId(attr.id); setEditItem(attr); }} className="text-indigo-400 hover:text-indigo-600" title="編集">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(attr.id)} className="text-gray-300 hover:text-red-500" title="削除">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                </>
            )}
        </tr>
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
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
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">ステータス項目定義</h3>
                    <p className="text-sm text-gray-500">ゲームや世界観に合わせた独自のステータス項目（HP, 筋力, 魅力など）を定義します。</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> 新規項目追加
                </button>
            </div>

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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                                <th className="p-3 w-10"></th>
                                <th className="p-3 font-medium">表示名</th>
                                <th className="p-3 font-medium">説明</th>
                                <th className="p-3 w-24 text-center font-medium">有効</th>
                                <th className="p-3 w-24 text-center font-medium">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <SortableContext
                                items={attributes.map(a => a.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {attributes.map(attr => (
                                    <SortableRow
                                        key={attr.id}
                                        attr={attr}
                                        editingId={editingId}
                                        editItem={editItem}
                                        setEditItem={setEditItem}
                                        setEditingId={setEditingId}
                                        handleUpdate={handleUpdate}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                            {attributes.length === 0 && !isCreating && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        ステータス項目が登録されていません。右上から追加してください。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DndContext>
        </div>
    );
}
