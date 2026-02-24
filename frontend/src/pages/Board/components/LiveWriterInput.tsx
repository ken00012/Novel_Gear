import { useState, useEffect } from 'react';
import { api, type BoardNamePreset } from '../../../api';
import { RefreshCw, Send, PlusCircle } from 'lucide-react';

interface LiveWriterInputProps {
    namePresets: BoardNamePreset[];
    onReloadPresets: () => void;
    onSubmit: (name: string, userIdStr: string, content: string) => void;
}

export default function LiveWriterInput({ namePresets, onReloadPresets, onSubmit }: LiveWriterInputProps) {
    const [name, setName] = useState('名無しさん');
    const [userIdStr, setUserIdStr] = useState('');
    const [content, setContent] = useState('');

    const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setUserIdStr(result);
    };

    // 初期マウント時にIDを自動生成
    useEffect(() => {
        if (!userIdStr) generateId();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectPreset = (preset: BoardNamePreset) => {
        setName(preset.name);
        if (preset.user_id_str) {
            setUserIdStr(preset.user_id_str);
        } else {
            generateId(); // PresetにID指定がない場合（名無し等）は再生成する
        }
    };

    const handleAddPreset = async () => {
        const n = prompt('新しく登録する名前を入力してください');
        if (!n) return;
        const confirmId = confirm('現在のIDも合わせて固定登録しますか？（コテハン用）\n※キャンセルを選ぶとIDは名前変更時に自動生成されます');
        try {
            await api.post('/board_name_presets/', {
                name: n,
                user_id_str: confirmId ? userIdStr : null,
                order_index: namePresets.length
            });
            onReloadPresets();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = () => {
        if (!name || !content) return;
        onSubmit(name, userIdStr, content);
        setContent(''); // 送信後にテキストをクリア
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col gap-3 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                <button
                    onClick={handleAddPreset}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200 transition whitespace-nowrap"
                >
                    <PlusCircle size={12} /> 登録
                </button>
            </div>

            <div className="flex gap-3">
                <div className="flex flex-col gap-2 w-64 shrink-0">
                    <div className="flex items-center border rounded-lg bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition px-3 py-1.5">
                        <span className="text-xs text-gray-400 font-bold mr-2 w-10">名前</span>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="bg-transparent w-full text-sm outline-none font-medium"
                            placeholder="名無しさん"
                        />
                    </div>
                    <div className="flex items-center border rounded-lg bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition px-3 py-1.5">
                        <span className="text-xs text-gray-400 font-bold mr-2 w-10">ID</span>
                        <input
                            value={userIdStr}
                            onChange={e => setUserIdStr(e.target.value)}
                            className="bg-transparent w-full text-sm outline-none font-mono"
                        />
                        <button onClick={generateId} className="text-gray-400 hover:text-indigo-600 transition" title="IDを再生成">
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex gap-2">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="発言内容を入力 (Ctrl+Enterで送信)"
                        className="flex-1 border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        rows={3}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!name || !content}
                        className="w-20 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg flex flex-col items-center justify-center gap-1 transition shadow-sm"
                    >
                        <Send size={18} />
                        <span className="text-xs font-bold">書き込む</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
