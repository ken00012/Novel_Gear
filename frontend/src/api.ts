import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Types
export interface CustomAttribute {
    id: number;
    character_id: number;
    attribute_name: string;
    attribute_value?: string;
    is_public: boolean;
}

export interface Character {
    id: number;
    name: string;
    age?: string;
    gender?: string;
    faction?: string;
    appearance?: string;
    personality?: string;
    memo?: string;
    visibility_settings: Record<string, boolean>;
    attributes: CustomAttribute[];
}

export interface Event {
    id: number;
    chapter_number: string;
    event_name: string;
    order_index: number;
}

export interface CharacterState {
    id: number;
    character_id: number;
    event_id: number;
    hp_base: number;
    hp_mod: number;
    mp_base: number;
    mp_mod: number;
    str_base: number;
    str_mod: number;
    mag_base: number;
    mag_mod: number;
    spd_base: number;
    spd_mod: number;
    luk_base: number;
    luk_mod: number;
    visibility_settings: Record<string, boolean>;
}
