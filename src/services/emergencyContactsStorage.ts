import * as SecureStore from 'expo-secure-store';

export interface EmergencyContact {
  name: string;
  phone: string;
}

const KEY = 'st_emergency_contacts';

/** Retorna siempre un array de exactamente 3 slots (null = vacío). */
export const emergencyContactsStorage = {
  async getAll(): Promise<(EmergencyContact | null)[]> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (!raw) return [null, null, null];
      const parsed = JSON.parse(raw) as (EmergencyContact | null)[];
      return [0, 1, 2].map((i) => parsed[i] ?? null);
    } catch {
      return [null, null, null];
    }
  },

  async setContact(index: 0 | 1 | 2, contact: EmergencyContact): Promise<void> {
    const contacts = await this.getAll();
    contacts[index] = { name: contact.name.trim(), phone: contact.phone.trim() };
    await SecureStore.setItemAsync(KEY, JSON.stringify(contacts));
  },

  async removeContact(index: 0 | 1 | 2): Promise<void> {
    const contacts = await this.getAll();
    contacts[index] = null;
    await SecureStore.setItemAsync(KEY, JSON.stringify(contacts));
  },
};
