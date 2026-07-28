import { db, LocationRecord, ScenarioRecord, ChecklistItemRecord, TargetLevelRecord, SupplyCatalogRecord, EquipmentCatalogRecord } from './bastion-db';
import { SUPPLY_CATALOG } from '../data/supply-catalog.data';
import { EQUIPMENT_CATALOG } from '../data/equipment-catalog.data';

function newId(): string { return crypto.randomUUID(); }

export async function seedIfEmpty(): Promise<void> {
  const count = await db.settings.count();
  if (count > 0) return;

  await db.settings.bulkAdd([
    { key: 'memberCount',    value: '4' },
    { key: 'householdName', value: 'Moje gospodarstwo domowe' }
  ]);

  await db.locations.bulkAdd([
    { id: newId(), name: 'Spiżarnia',           description: 'Główna spiżarnia w kuchni' },
    { id: newId(), name: 'Piwnica',              description: 'Długoterminowe zapasy' },
    { id: newId(), name: 'Torba w samochodzie',  description: 'EDC w bagażniku' },
    { id: newId(), name: 'Plecak ewakuacyjny',   description: '72h bug-out bag' }
  ] as LocationRecord[]);

  await db.targetLevels.bulkAdd([
    { id: newId(), category: 'Water',     quantityPerPersonPerDay: 3,    horizonDays: 14, unit: 'L',    isConsumable: true,  weight: 3   },
    { id: newId(), category: 'Food',      quantityPerPersonPerDay: 0.5,  horizonDays: 14, unit: 'kg',   isConsumable: true,  weight: 3   },
    { id: newId(), category: 'Medical',   quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: true,  weight: 2   },
    { id: newId(), category: 'Hygiene',   quantityPerPersonPerDay: 0.05, horizonDays: 14, unit: 'kg',   isConsumable: true,  weight: 1   },
    { id: newId(), category: 'Energy',    quantityPerPersonPerDay: 0.5,  horizonDays: 14, unit: 'szt',  isConsumable: true,  weight: 1   },
    { id: newId(), category: 'Tools',     quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: false, weight: 0.5 },
    { id: newId(), category: 'Documents', quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: false, weight: 0.5 }
  ] as TargetLevelRecord[]);

  const s1 = newId(), s2 = newId(), s3 = newId(), s4 = newId();
  await db.scenarios.bulkAdd([
    { id: s1, name: 'Awaria prądu',                description: 'Kroki do wykonania w przypadku przerwy w dostawie energii elektrycznej.' },
    { id: s2, name: 'Ewakuacja',                   description: 'Plan ewakuacji z domu — gdy grozi niebezpieczeństwo i trzeba szybko opuścić nieruchomość.' },
    { id: s3, name: 'Brak wody w kranie',          description: 'Postępowanie w przypadku przerwy w dostawie wody wodociągowej.' },
    { id: s4, name: 'Kontrola apteczki — cykliczna', description: 'Rutynowa kontrola apteczek domowych. Wykonywać co 6 miesięcy.' }
  ] as ScenarioRecord[]);

  await db.checklistItems.bulkAdd([
    { id: newId(), scenarioId: s1, text: 'Uruchom generator lub przygotuj świece i latarki',                         sortOrder: 1,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Sprawdź stan paliwa w generatorze',                                        sortOrder: 2,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Wyłącz zbędne urządzenia (ochrona przed przepięciem przy powrocie prądu)', sortOrder: 3,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Nie otwieraj lodówki bez potrzeby — żywność wytrzyma 4h',                  sortOrder: 4,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Naładuj powerbanki i urządzenia mobilne',                                  sortOrder: 5,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Przełącz telefony w tryb oszczędzania energii',                            sortOrder: 6,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Włącz radioodtwarzacz — śledź komunikaty służb',                           sortOrder: 7,  isCompleted: false },
    { id: newId(), scenarioId: s1, text: 'Poinformuj rodzinę i sąsiadów o sytuacji',                                 sortOrder: 8,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Zabierz plecak ewakuacyjny (gotowy, stoi przy drzwiach)',                  sortOrder: 1,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Dokumenty: dowód, paszport, polisy ubezpieczeniowe, prawo jazdy',          sortOrder: 2,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Leki na min. 7 dni i apteczka pierwszej pomocy',                          sortOrder: 3,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Woda (min. 2L/os) i żywność na 72h',                                      sortOrder: 4,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Odzież na 3 dni i zmiana dla dzieci',                                     sortOrder: 5,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Ładowarki, powerbanki, latarka, radio na baterie',                        sortOrder: 6,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Wyłącz gaz, wodę i prąd (główne zawory/bezpieczniki)',                   sortOrder: 7,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Zabezpiecz zwierzęta — nosidło, smycz, jedzenie',                         sortOrder: 8,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Poinformuj bliskich o miejscu docelowym i trasie',                        sortOrder: 9,  isCompleted: false },
    { id: newId(), scenarioId: s2, text: 'Zamknij i zabezpiecz dom',                                                sortOrder: 10, isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Sprawdź zapasy wody butelkowanej w spiżarni i piwnicy',                   sortOrder: 1,  isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Napełnij wannę i duże pojemniki, jeśli ciśnienie jeszcze jest',           sortOrder: 2,  isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Ogranicz zużycie — priorytet: picie i gotowanie',                        sortOrder: 3,  isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Uruchom filtr do wody (woda deszczowa, studnia)',                         sortOrder: 4,  isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Użyj tabletek do uzdatniania wody przy niepewnym źródle',                 sortOrder: 5,  isCompleted: false },
    { id: newId(), scenarioId: s3, text: 'Zadzwoń na awaryjny numer wodociągów',                                    sortOrder: 6,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Sprawdź daty ważności leków — wyrzuć przeterminowane',                   sortOrder: 1,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Uzupełnij zużyte opatrunki, bandaże i plastry',                          sortOrder: 2,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Sprawdź stan rękawiczek jednorazowych (czy nie kruche)',                  sortOrder: 3,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Uzupełnij płyn antyseptyczny',                                           sortOrder: 4,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Sprawdź czytelność instrukcji pierwszej pomocy',                         sortOrder: 5,  isCompleted: false },
    { id: newId(), scenarioId: s4, text: 'Zaktualizuj listę leków alergicznych w rodzinie',                        sortOrder: 6,  isCompleted: false }
  ] as ChecklistItemRecord[]);
}

// Runs separately from seedIfEmpty() so existing users (with settings already set)
// also get catalog tables seeded after the v2 schema upgrade.
export async function seedCatalogIfEmpty(): Promise<void> {
  const count = await db.supplyCatalog.count();
  if (count > 0) return;

  await db.supplyCatalog.bulkAdd(
    SUPPLY_CATALOG.map(c => ({
      name: c.name,
      id: crypto.randomUUID(),
      category: c.category,
      unit: c.unit,
      suggestedQty: c.suggestedQty,
      price: null
    } as SupplyCatalogRecord))
  );

  await db.equipmentCatalog.bulkAdd(
    EQUIPMENT_CATALOG.map(c => ({
      name: c.name,
      id: crypto.randomUUID(),
      category: c.category,
      hint: c.hint,
      price: null
    } as EquipmentCatalogRecord))
  );
}
