import type { Lead } from './types';

const STORAGE_KEY = 'skattesjekk:leads';

/**
 * Mock-tjeneste for leads. I produksjon sendes leadet til et API som
 * matcher, varsler rådgiveren og registrerer leadet for fakturering.
 */
export async function submitLead(input: Omit<Lead, 'id' | 'createdAt' | 'status'>): Promise<Lead> {
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID?.() ?? String(Date.now()),
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Lead[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, lead]));
  } catch {
    // Ingen lagring tilgjengelig – leadet går tapt i demo-modus.
  }
  await new Promise((r) => setTimeout(r, 600));
  return lead;
}
