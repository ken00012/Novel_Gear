import type { ReactNode } from 'react';

interface LibraryEmptyStateProps {
    message: string;
}

export function LibraryEmptyState({ message }: LibraryEmptyStateProps) {
    return (
        <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center justify-center">
            {message}
        </div>
    );
}

interface LibraryTabHeaderProps {
    title: string;
    description: string;
    icon?: ReactNode;
    actionButton?: ReactNode;
}

export function LibraryTabHeader({ title, description, icon, actionButton }: LibraryTabHeaderProps) {
    return (
        <div className="p-6 border-b border-gray-200 flex justify-between items-center shrink-0 bg-white rounded-t-lg">
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className="flex items-center gap-4">
                {actionButton}
            </div>
        </div>
    );
}
