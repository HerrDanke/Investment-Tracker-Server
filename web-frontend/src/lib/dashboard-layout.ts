import type { DashboardLayout } from '../types';
import { DEFAULT_LAYOUT } from '../types';

const STORAGE_KEY = 'dashboard-layout';

export function loadDashboardLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_LAYOUT;
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
