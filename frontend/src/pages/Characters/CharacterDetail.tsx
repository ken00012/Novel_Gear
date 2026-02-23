import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Character, type CustomAttribute } from '../../api';
import { default as CharacterDetailView } from './CharacterDetailView';

// Implementation split for better architecture
export default function CharacterDetail() {
    return <CharacterDetailView />;
}
