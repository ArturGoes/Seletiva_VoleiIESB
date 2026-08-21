import localforage from 'localforage';
import type { StateStorage } from 'zustand/middleware';

// IndexedDB via localforage, com fallback automático para localStorage / WebSQL.
const store = localforage.createInstance({
  name: 'seletiva-iesb',
  storeName: 'estado',
  description: 'Dados da Seletiva de Vôlei de Areia IESB',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE]
});

// Marcador simples de "salvamento em andamento / salvo" para a UI.
type SaveListener = (status: 'salvando' | 'salvo') => void;
const listeners = new Set<SaveListener>();
export function onSaveStatus(fn: SaveListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(status: 'salvando' | 'salvo') {
  listeners.forEach((l) => l(status));
}

export const localforageStorage: StateStorage = {
  getItem: async (name) => {
    const value = await store.getItem<string>(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    emit('salvando');
    await store.setItem(name, value);
    emit('salvo');
  },
  removeItem: async (name) => {
    await store.removeItem(name);
  }
};

export { store as rawStorage };
