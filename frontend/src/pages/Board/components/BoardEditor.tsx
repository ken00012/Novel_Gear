import { useState, useEffect, useRef } from 'react';
import { api, type BoardThread, type BoardPost, type BoardNamePreset } from '../../../api';
import LiveWriterInput from './LiveWriterInput';
import PostItem from './PostItem';
import { Settings, Copy } from 'lucide-react';

interface BoardEditorProps {
    thread: BoardThread;
    onThreadUpdate: () => void;
}

export default function BoardEditor({ thread, onThreadUpdate }: BoardEditorProps) {
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [namePresets, setNamePresets] = useState<BoardNamePreset[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    // Thread settings temp state
    const [threadTemplate, setThreadTemplate] = useState(thread.thread_template);
    const [postTemplate, setPostTemplate] = useState(thread.post_template);

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
    }, [thread]);

    const handleSaveTemplates = async () => {
        try {
            await api.put(`/board_threads/${thread.id}`, {
                title: thread.title,
                thread_template: threadTemplate,
                post_template: postTemplate
            });
            setShowSettings(false);
            onThreadUpdate();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRenumberAndSave = async (newPosts: BoardPost[]) => {
        // Renumber based on array index
        const renumbered = newPosts.map((p, index) => ({
            ...p,
            number: index + 1,
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
            const targetNumber = insertIndex >= 0 ? insertIndex + 1 : posts.length + 1;

            const res = await api.post<BoardPost>('/board_posts/', {
                thread_id: thread.id,
                number: targetNumber,
                name,
                user_id_str: userIdStr,
                content,
                order_index: targetNumber - 1
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

    const handleUpdatePost = async (id: number, content: string) => {
        const p = posts.find(x => x.id === id);
        if (!p) return;
        try {
            await api.put(`/board_posts/${id}`, {
                ...p,
                content
            });
            setPosts(posts.map(x => x.id === id ? { ...x, content } : x));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCopyAll = () => {
        let text = thread.thread_template
            .replace('{{title}}', thread.title)
            .replace('{{date}}', new Date(thread.created_at).toLocaleString('ja-JP'))
            .replace('{{id}}', 'THREAD_OWNER'); // mock logic for thread owner if needed

        // Convert escaped \n characters from DB if they exist as literal text
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

        navigator.clipboard.writeText(text);
        alert('テンプレートに従って全内容をプレーンテキストでコピーしました！');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <div className="p-4 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                <h3 className="text-xl font-bold text-gray-800">{thread.title}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Settings size={16} /> テンプレート設定
                    </button>
                    <button
                        onClick={handleCopyAll}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition font-medium shadow-sm"
                    >
                        <Copy size={16} /> テキスト出力(コピー)
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="p-4 border-b bg-gray-50 shrink-0">
                    <div className="flex flex-col gap-3 max-w-3xl">
                        <div className="bg-indigo-50 border border-indigo-100 p-2 text-xs text-indigo-800 rounded mb-2">
                            プレースホルダーとして <b>{'{'}{'{'}number{'}'}{'}'}</b>, <b>{'{'}{'{'}name{'}'}{'}'}</b>, <b>{'{'}{'{'}id{'}'}{'}'}</b>, <b>{'{'}{'{'}content{'}'}{'}'}</b>, <b>{'{'}{'{'}title{'}'}{'}'}</b>, <b>{'{'}{'{'}date{'}'}{'}'}</b> が使用できます。<br />
                            改行を含めたい場合は \n と入力するか、そのままEnterで改行してください。
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">スレッド出力テンプレート</label>
                            <textarea
                                value={threadTemplate}
                                onChange={e => setThreadTemplate(e.target.value)}
                                className="w-full text-xs font-mono p-2 border rounded focus:ring-1 focus:outline-none" rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">レス出力テンプレート</label>
                            <textarea
                                value={postTemplate}
                                onChange={e => setPostTemplate(e.target.value)}
                                className="w-full text-xs font-mono p-2 border rounded focus:ring-1 focus:outline-none" rows={3}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleSaveTemplates} className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-bold rounded hover:bg-indigo-200 transition">変更を保存</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-60" ref={scrollRef}>
                {posts.map((post, i) => (
                    <PostItem
                        key={post.id}
                        post={post}
                        onDelete={() => handleDeletePost(post.id)}
                        onUpdate={(c) => handleUpdatePost(post.id, c)}
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
        </div>
    );
}
