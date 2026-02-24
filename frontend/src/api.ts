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
    is_status_enabled: boolean;
    job_id?: number;
    level: number;
    talent_bonuses: Record<string, any>;
    job?: Job;
    skills: Skill[];
    equipments: Equipment[];
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
    job_id?: number | null;
    level?: number;
    skills?: Skill[];
    equipments?: Equipment[];
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
    memo?: string;
}

export interface Modifier {
    attribute: string;
    type: 'flat' | 'percent';
    value: number;
}

export interface Job {
    id: number;
    name: string;
    description?: string;
    base_stats: Record<string, number>;
    stat_growth: Record<string, number>;
}

export interface Skill {
    id: number;
    name: string;
    description?: string;
    modifiers: Modifier[];
}

export interface Equipment {
    id: number;
    name: string;
    description?: string;
    rarity?: string;
    modifiers: Modifier[];
}

export interface Glossary {
    id: number;
    term: string;
    description?: string;
}

export interface Plot {
    id: number;
    event_id?: number | null;
    phase_type: string;  // 'ki', 'sho', 'ten', 'ketsu'
    title: string;
    character_arc?: string | null;
    content?: string | null;
    order_index: number;
}

// Board Simulator
export interface BoardThread {
    id: number;
    title: string;
    thread_template: string;
    post_template: string;
    created_at: string;
    posts?: BoardPost[];
}

export interface BoardPost {
    id: number;
    thread_id: number;
    number: number;
    name: string;
    user_id_str: string;
    content: string;
    order_index: number;
}

export interface BoardNamePreset {
    id: number;
    name: string;
    user_id_str?: string | null;
    order_index: number;
}
