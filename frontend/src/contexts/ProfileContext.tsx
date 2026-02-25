import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type CharacterProfileAttribute } from '../api';

interface ProfileContextType {
    profileAttributes: CharacterProfileAttribute[];
    loading: boolean;
    refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
    profileAttributes: [],
    loading: true,
    refresh: async () => { },
});

export const useProfileAttributes = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profileAttributes, setProfileAttributes] = useState<CharacterProfileAttribute[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttributes = async () => {
        setLoading(true);
        try {
            const res = await api.get<CharacterProfileAttribute[]>('/profile_attributes/');
            setProfileAttributes(res.data);
        } catch (e) {
            console.error('Failed to fetch profile attributes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    return (
        <ProfileContext.Provider value={{ profileAttributes, loading, refresh: fetchAttributes }}>
            {children}
        </ProfileContext.Provider>
    );
};
