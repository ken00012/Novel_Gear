import { useState, useEffect, useRef } from 'react';
import { api, type BoardThread, type BoardPost, type BoardNamePreset } from '../../../api';
import LiveWriterInput from './LiveWriterInput';
import PostItem from './PostItem';
import { Settings, Copy, Check, X } from 'lucide-react';

interface BoardEditorProps {
    thread: BoardThread;
    onThreadUpdate: () => void;
}

export default function BoardEditor({ thread, onThreadUpdate }: BoardEditorProps) {
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [namePresets, setNamePresets] = useState<BoardNamePreset[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewText, setPreviewText] = useState('');

    // Thread settings temp state
    const [threadTemplate, setThreadTemplate] = useState(thread.thread_template);
    const [postTemplate, setPostTemplate] = useState(thread.post_template);
    const [startIndex, setStartIndex] = useState(thread.start_index);

    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchPosts = async () => {
        try {
            const res = await api.get<BoardPost[]>(`/board_threads/${thread.id}/posts/`);
            setPosts(res.data);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 50);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchNamePresets = async () => {
        try {
            const res = await api.get<BoardNamePreset[]>('/board_name_presets/');
            setNamePresets(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchNamePresets();
        setThreadTemplate(thread.thread_template);
        setPostTemplate(thread.post_template);
        setStartIndex(thread.start_index);
    }, [thread]);

    const handleSaveTemplates = async () => {
        try {
            await api.put(`/board_threads/${thread.id}`, {
                title: thread.title,
                thread_template: threadTemplate,
                post_template: postTemplate,
                start_index: startIndex
            });
            setShowSettings(false);

            if (startIndex !== thread.start_index) {
                await handleRenumberAndSave(posts, startIndex);
            }

            onThreadUpdate();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRenumberAndSave = async (newPosts: BoardPost[], baseIndex: number = thread.start_index) => {
        // Renumber based on array index and start_index
        const renumbered = newPosts.map((p, index) => ({
            ...p,
            number: index + baseIndex,
            order_index: index
        }));

        // Optimistic update
        setPosts(renumbered);

        // Save to backend
        try {
            await api.put('/board_posts/bulk_update/', renumbered);
            fetchPosts(); // Refetch to be safe
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddPost = async (name: string, userIdStr: string, content: string, insertIndex: number = -1) => {
        try {
            const targetNumber = insertIndex >= 0 ? insertIndex + thread.start_index : posts.length + thread.start_index;

            const res = await api.post<BoardPost>('/board_posts/', {
                thread_id: thread.id,
                number: targetNumber,
                name,
                user_id_str: userIdStr,
                content,
                order_index: insertIndex >= 0 ? insertIndex : posts.length
            });

            let newPosts = [...posts];
            if (insertIndex >= 0) {
                newPosts.splice(insertIndex, 0, res.data);
                handleRenumberAndSave(newPosts);
            } else {
                newPosts.push(res.data);
                setPosts(newPosts);
                setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }, 50);
            }

        } catch (e) {
            console.error(e);
        }
    };

    const handleDeletePost = async (id: number) => {
        if (!confirm('このレスを削除しますか？\n（以降のレス番号は自動的に振り直されます）')) return;
        try {
            await api.delete(`/board_posts/${id}`);
            const newPosts = posts.filter(p => p.id !== id);
            handleRenumberAndSave(newPosts);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdatePost = async (id: number, newName: string, content: string) => {
        const p = posts.find(x => x.id === id);
        if (!p) return;
        try {
            await api.put(`/board_posts/${id}`, {
                ...p,
                name: newName,
                content
            });
            setPosts(posts.map(x => x.id === id ? { ...x, name: newName, content } : x));
        } catch (e) {
            console.error(e);
        }
    };

    const handlePreview = () => {
        let text = thread.thread_template
            .replace('{{title}}', thread.title)
            .replace('{{date}}', new Date(thread.created_at).toLocaleString('ja-JP'))
            .replace('{{id}}', 'THREAD_OWNER');

        text = text.replace(/\\n/g, '\n');

        posts.forEach(p => {
            let postText = thread.post_template
                .replace('{{number}}', String(p.number))
                .replace('{{name}}', p.name)
                .replace('{{id}}', p.user_id_str)
                .replace('{{content}}', p.content);
            postText = postText.replace(/\\n/g, '\n');
            text += postText;
        });

        setPreviewText(text);
        setShowPreview(true);
    };

    const handleCopyFromPreview = () => {
        navigator.clipboard.writeText(previewText);
        setShowPreview(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <div className="p-4 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-20 relative">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-gray-800">{thread.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-bold">開始レス番号:</span>
                        <input
                            type="number"
                            min={1}
                            value={startIndex}
                            onChange={e => setStartIndex(parseInt(e.target.value) || 1)}
                            className="w-16 p-1 bg-gray-50 border border-gray-300 rounded font-mono text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            title="ここを変更して右のボタンで保存すると、以降のレス番号が振り直されます"
                        />
                        <button
                            onClick={handleSaveTemplates}
                            disabled={startIndex === thread.start_index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-bold hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                            title="開始番号の変更を適用"
                        >
                            適用
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm transition ${showSettings ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Settings size={16} /> テンプレート設定
                    </button>
                    <button
                        onClick={handlePreview}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition font-medium shadow-sm"
                    >
                        <Copy size={16} /> プレビューして出力
                    </button>
                </div>
            </div>

            {/* Settings Panel (Floating Design) */}
            {showSettings && (
                <div className="absolute top-[80px] right-4 w-96 bg-white border-2 border-indigo-400 rounded-lg shadow-2xl p-4 z-50 flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-800 flex items-center gap-1 text-sm">
                            <Settings size={16} className="text-indigo-600" /> テンプレート設定
                        </h4>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 p-1 transition">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-2 text-xs text-indigo-800 rounded">
                        プレースホルダーとして <b>{'{'}{'{'}number{'}'}{'}'}</b>, <b>{'{'}{'{'}name{'}'}{'}'}</b>, <b>{'{'}{'{'}id{'}'}{'}'}</b>, <b>{'{'}{'{'}content{'}'}{'}'}</b>, <b>{'{'}{'{'}title{'}'}{'}'}</b>, <b>{'{'}{'{'}date{'}'}{'}'}</b> が使用できます。<br />
                        改行を含めたい場合は \n と入力するか、そのままEnterで改行してください。
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">スレッド出力テンプレート</label>
                        <textarea
                            value={threadTemplate}
                            onChange={e => setThreadTemplate(e.target.value)}
                            className="w-full text-xs font-mono p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-gray-800 resize-none" rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">レス出力テンプレート</label>
                        <textarea
                            value={postTemplate}
                            onChange={e => setPostTemplate(e.target.value)}
                            className="w-full text-xs font-mono p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-gray-800 resize-none" rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">開始レス番号 (ヘッダーと連動)</label>
                        <input
                            type="number"
                            min={1}
                            value={startIndex}
                            onChange={e => setStartIndex(parseInt(e.target.value) || 1)}
                            className="w-32 text-xs font-mono p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-gray-800"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleSaveTemplates} className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded hover:bg-indigo-700 transition shadow-sm">設定を保存</button>
                    </div>
                </div>
            )}

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-60" ref={scrollRef}>
                {posts.map((post, i) => (
                    <PostItem
                        key={post.id}
                        post={post}
                        namePresets={namePresets}
                        onDelete={() => handleDeletePost(post.id)}
                        onUpdate={(newName, c) => handleUpdatePost(post.id, newName, c)}
                        onInsertAbove={(name, idStr, c) => handleAddPost(name, idStr, c, i)}
                    />
                ))}
                {posts.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">まだ書き込みがありません。下部のエリアから発言を投稿してください。</div>
                )}
            </div>

            {/* Live Writer Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <LiveWriterInput
                    namePresets={namePresets}
                    onReloadPresets={fetchNamePresets}
                    onSubmit={(name, idStr, content) => handleAddPost(name, idStr, content)}
                />
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-4xl flex flex-col h-[85vh]">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Copy size={20} className="text-indigo-600" /> テキスト出力プレビュー
                            </h3>
                            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-2">
                            <p className="text-sm text-gray-600">
                                以下のテキストがクリップボードにコピーされます。必要に応じてここで最終調整（手書き編集）が可能です。
                            </p>
                            <textarea
                                value={previewText}
                                onChange={e => setPreviewText(e.target.value)}
                                className="w-full flex-1 border border-gray-300 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            />
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100 transition text-sm font-bold"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCopyFromPreview}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-bold shadow-sm"
                            >
                                <Check size={16} /> コピーして閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
