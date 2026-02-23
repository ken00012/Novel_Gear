import { useState, useEffect } from 'react';
import { api, type Event, type Character, type CharacterState } from '../../api';
import { Plus, ChevronDown, CheckCircle2, Copy } from 'lucide-react';
import { default as StatusDashboardView } from './StatusDashboardView';

export default function StatusDashboard() {
    return <StatusDashboardView />;
}
