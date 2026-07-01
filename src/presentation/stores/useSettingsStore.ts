import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../../core/domain/AppSettings';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: new AppSettings(),
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: new AppSettings() }),
    }),
    { name: 'moneyflows_settings' },
  ),
);
