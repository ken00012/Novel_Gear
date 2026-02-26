import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type StatusAttribute } from '../api';

interface StatusContextType {
    statusAttributes: StatusAttribute[];
    loading: boolean;
    refresh: () => Promise<void>;
}

const StatusContext = createContext<StatusContextType>({
    statusAttributes: [],
    loading: true,
    refresh: async () => { },
});

export const useStatusAttributes = () => useContext(StatusContext);

export const StatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [statusAttributes, setStatusAttributes] = useState<StatusAttribute[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttributes = async () => {
        setLoading(true);
        try {
            const res = await api.get<StatusAttribute[]>('/status_attributes/');
            setStatusAttributes(res.data);
        } catch (e) {
            console.error('Failed to fetch status attributes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    return (
        <StatusContext.Provider value={{ statusAttributes, loading, refresh: fetchAttributes }}>
            {children}
        </StatusContext.Provider>
    );
};
