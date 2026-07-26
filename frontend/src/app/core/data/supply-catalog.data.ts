import { SupplyCategory } from '../models/supply.model';

export interface CatalogSupplyItem {
  name: string;
  category: SupplyCategory;
  unit: string;
  suggestedQty: number;
}

export function findCatalogMatch(name: string): CatalogSupplyItem | undefined {
  const lower = name.toLowerCase();
  const exact = SUPPLY_CATALOG.find(c => c.name.toLowerCase() === lower);
  if (exact) return exact;
  let bestMatch: CatalogSupplyItem | undefined;
  let bestScore = 0;
  for (const c of SUPPLY_CATALOG) {
    const words = c.name.toLowerCase().split(/[\s()/]+/).filter(w => w.length > 3);
    const score = words.filter(w => lower.includes(w)).length;
    if (score > bestScore) { bestScore = score; bestMatch = c; }
  }
  return bestScore > 0 ? bestMatch : undefined;
}

export const SUPPLY_CATALOG: CatalogSupplyItem[] = [
  { name: 'Woda mineralna', category: 'Water', unit: 'L', suggestedQty: 42 },
  { name: 'Tabletki do uzdatniania wody', category: 'Water', unit: 'szt', suggestedQty: 50 },
  { name: 'Filtr do wody (Brita/BWT)', category: 'Water', unit: 'szt', suggestedQty: 1 },
  { name: 'Konserwy mięsne', category: 'Food', unit: 'szt', suggestedQty: 20 },
  { name: 'Konserwy rybne', category: 'Food', unit: 'szt', suggestedQty: 10 },
  { name: 'Makaron', category: 'Food', unit: 'kg', suggestedQty: 5 },
  { name: 'Ryż', category: 'Food', unit: 'kg', suggestedQty: 5 },
  { name: 'Kasza gryczana', category: 'Food', unit: 'kg', suggestedQty: 3 },
  { name: 'Mąka pszenna', category: 'Food', unit: 'kg', suggestedQty: 3 },
  { name: 'Cukier', category: 'Food', unit: 'kg', suggestedQty: 2 },
  { name: 'Sól', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Olej roślinny', category: 'Food', unit: 'L', suggestedQty: 2 },
  { name: 'Miód', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Herbata', category: 'Food', unit: 'op', suggestedQty: 3 },
  { name: 'Orzechy i suszone owoce', category: 'Food', unit: 'kg', suggestedQty: 1 },
  { name: 'Dżem / marmolada', category: 'Food', unit: 'szt', suggestedQty: 4 },
  { name: 'Bandaże elastyczne', category: 'Medical', unit: 'szt', suggestedQty: 4 },
  { name: 'Gaza jałowa', category: 'Medical', unit: 'szt', suggestedQty: 10 },
  { name: 'Plastry (zestaw)', category: 'Medical', unit: 'op', suggestedQty: 2 },
  { name: 'Środek odkażający (Octenisept)', category: 'Medical', unit: 'szt', suggestedQty: 1 },
  { name: 'Ibuprofen / Paracetamol', category: 'Medical', unit: 'op', suggestedQty: 2 },
  { name: 'Rękawice jednorazowe', category: 'Medical', unit: 'par', suggestedQty: 20 },
  { name: 'Termometr', category: 'Medical', unit: 'szt', suggestedQty: 1 },
  { name: 'Papier toaletowy', category: 'Hygiene', unit: 'rolki', suggestedQty: 40 },
  { name: 'Mydło', category: 'Hygiene', unit: 'szt', suggestedQty: 6 },
  { name: 'Pasta do zębów', category: 'Hygiene', unit: 'szt', suggestedQty: 3 },
  { name: 'Żel / płyn dezynfekujący do rąk', category: 'Hygiene', unit: 'szt', suggestedQty: 2 },
  { name: 'Mokre chusteczki', category: 'Hygiene', unit: 'op', suggestedQty: 5 },
  { name: 'Świece', category: 'Energy', unit: 'szt', suggestedQty: 10 },
  { name: 'Zapałki', category: 'Energy', unit: 'szt', suggestedQty: 5 },
  { name: 'Latarka LED', category: 'Energy', unit: 'szt', suggestedQty: 2 },
  { name: 'Baterie AA', category: 'Energy', unit: 'szt', suggestedQty: 12 },
  { name: 'Powerbank', category: 'Energy', unit: 'szt', suggestedQty: 1 },
  { name: 'Nóż wielofunkcyjny', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  { name: 'Lina (10 m)', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  { name: 'Taśma klejąca / duct tape', category: 'Tools', unit: 'szt', suggestedQty: 2 },
  { name: 'Radio na baterie', category: 'Tools', unit: 'szt', suggestedQty: 1 },
  { name: 'Kopie dokumentów (wodoszczelne opakowanie)', category: 'Documents', unit: 'kpl', suggestedQty: 1 },
  { name: 'Gotówka awaryjna', category: 'Documents', unit: 'kpl', suggestedQty: 1 },
];
