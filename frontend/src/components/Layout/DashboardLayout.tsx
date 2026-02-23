import { Outlet, Link, useLocation } from "react-router-dom";
import { Book, Users, BarChart2, MessageSquare } from "lucide-react";

export default function DashboardLayout() {
    const location = useLocation();

    const navItems = [
        { name: "プロット", path: "/plot", icon: Book },
        { name: "登場人物", path: "/characters", icon: Users },
        { name: "ステータス", path: "/status", icon: BarChart2 },
        { name: "掲示板生成", path: "/board", icon: MessageSquare },
    ];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold tracking-wider text-indigo-600">Novel Gear</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
