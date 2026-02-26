import React, { useState, useEffect } from 'react';

interface CreateItemFormProps {
    chapterLabel?: string;
    chapterPlaceholder?: string;
    titleLabel?: string;
    titlePlaceholder?: string;
    initialChapter?: string;
    initialTitle?: string;
    onSubmit: (chapter: string, title: string) => void;
    onCancel: () => void;
    submitLabel?: string;
    className?: string;
}

export default function CreateItemForm({
    chapterLabel = "章番号",
    chapterPlaceholder = "例: 第1話",
    titleLabel = "タイトル",
    titlePlaceholder = "例: タイトルを入力",
    initialChapter = "",
    initialTitle = "",
    onSubmit,
    onCancel,
    submitLabel = "追加",
    className = "bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 flex flex-col gap-3 shadow-sm"
}: CreateItemFormProps) {
    const [chapter, setChapter] = useState(initialChapter);
    const [title, setTitle] = useState(initialTitle);

    // Initial state reflection (for editing mode)
    useEffect(() => {
        setChapter(initialChapter);
        setTitle(initialTitle);
    }, [initialChapter, initialTitle]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && title.trim()) {
            onSubmit(chapter, title);
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className={className}>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">{chapterLabel}</label>
                <input
                    type="text"
                    placeholder={chapterPlaceholder}
                    value={chapter}
                    onChange={e => setChapter(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">{titleLabel} <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder={titlePlaceholder}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancel} className="text-sm font-medium text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-md transition duration-150">
                    キャンセル
                </button>
                <button
                    onClick={() => onSubmit(chapter, title)}
                    disabled={!title.trim()}
                    className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-5 py-1.5 rounded-md transition duration-150 shadow-sm"
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}
