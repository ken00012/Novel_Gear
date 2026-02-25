import { useState } from 'react';
import { Briefcase, Zap, Shield, BookOpen, Settings2 } from 'lucide-react';
import JobTab from './JobTab';
import SkillTab from './SkillTab';
import EquipmentTab from './EquipmentTab';
import GlossaryTab from './GlossaryTab';
import StatusAttributeTab from './StatusAttributeTab';

export default function LibraryDashboard() {
    const [activeTab, setActiveTab] = useState<'status' | 'jobs' | 'skills' | 'equipments' | 'glossary'>('status');

    const tabs = [
        { id: 'status', label: 'ステータス項目', icon: Settings2 },
        { id: 'jobs', label: 'ジョブ', icon: Briefcase },
        { id: 'skills', label: 'スキル', icon: Zap },
        { id: 'equipments', label: '装備品', icon: Shield },
        { id: 'glossary', label: '世界観用語', icon: BookOpen },
    ] as const;

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            <header className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">設定資料管理 (Library)</h2>
                <p className="text-sm text-gray-500 mt-1">物語のベースとなる設定や基礎データ・補正値を管理します。</p>
            </header>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-gray-200 bg-gray-50">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
                {activeTab === 'status' && <StatusAttributeTab />}
                {activeTab === 'jobs' && <JobTab />}
                {activeTab === 'skills' && <SkillTab />}
                {activeTab === 'equipments' && <EquipmentTab />}
                {activeTab === 'glossary' && <GlossaryTab />}
            </div>
        </div>
    );
}
