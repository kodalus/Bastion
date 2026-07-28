import { db, LocationRecord, SupplyRecord, EquipmentRecord, MaintenanceTaskRecord, ScenarioRecord, ChecklistItemRecord, TargetLevelRecord } from './bastion-db';

function newId(): string { return crypto.randomUUID(); }

function todayStr(): string { return new Date().toISOString().split('T')[0]; }

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function addYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

export async function seedIfEmpty(): Promise<void> {
  const count = await db.settings.count();
  if (count > 0) return;

  await db.settings.bulkAdd([
    { key: 'memberCount',    value: '4' },
    { key: 'householdName', value: 'Moje gospodarstwo domowe' }
  ]);

  const pantryId = newId(), basementId = newId(), carBagId = newId(), safetyKitId = newId();
  await db.locations.bulkAdd([
    { id: pantryId,    name: 'Spiżarnia',           description: 'Główna spiżarnia w kuchni' },
    { id: basementId,  name: 'Piwnica',              description: 'Długoterminowe zapasy' },
    { id: carBagId,    name: 'Torba w samochodzie',  description: 'EDC w bagażniku' },
    { id: safetyKitId, name: 'Plecak ewakuacyjny',   description: '72h bug-out bag' }
  ] as LocationRecord[]);

  await db.targetLevels.bulkAdd([
    { id: newId(), category: 'Water',     quantityPerPersonPerDay: 3,    horizonDays: 14, unit: 'L',    isConsumable: true },
    { id: newId(), category: 'Food',      quantityPerPersonPerDay: 0.5,  horizonDays: 14, unit: 'kg',   isConsumable: true },
    { id: newId(), category: 'Medical',   quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: true },
    { id: newId(), category: 'Hygiene',   quantityPerPersonPerDay: 0.05, horizonDays: 14, unit: 'kg',   isConsumable: true },
    { id: newId(), category: 'Energy',    quantityPerPersonPerDay: 0.5,  horizonDays: 14, unit: 'szt',  isConsumable: true },
    { id: newId(), category: 'Tools',     quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: false },
    { id: newId(), category: 'Documents', quantityPerPersonPerDay: 1,    horizonDays: 1,  unit: 'szt',  isConsumable: false }
  ] as TargetLevelRecord[]);

  const now = todayStr();
  await db.supplies.bulkAdd([
    { id: newId(), name: 'Woda źródlana 5L',            category: 'Water',     quantity: 12, unit: 'L',     storageLocationId: pantryId,    expiryDate: addYears(1),    estimatedPricePerUnit: 1.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Woda mineralna 1.5L',          category: 'Water',     quantity: 9,  unit: 'L',     storageLocationId: basementId,  expiryDate: addMonths(8),   estimatedPricePerUnit: 1.20,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Tabletki do uzdatniania wody', category: 'Water',     quantity: 50, unit: 'szt',   storageLocationId: safetyKitId, expiryDate: addDays(25),    estimatedPricePerUnit: 0.20,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Ryż biały 5kg',                category: 'Food',      quantity: 5,  unit: 'kg',    storageLocationId: pantryId,    expiryDate: addYears(2),    estimatedPricePerUnit: 3.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Makaron penne 1kg',            category: 'Food',      quantity: 3,  unit: 'kg',    storageLocationId: pantryId,    expiryDate: addMonths(15),  estimatedPricePerUnit: 2.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Konserwy tuńczyk',             category: 'Food',      quantity: 12, unit: 'szt',   storageLocationId: basementId,  expiryDate: addYears(3),    estimatedPricePerUnit: 3.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Batony energetyczne',          category: 'Food',      quantity: 24, unit: 'szt',   storageLocationId: safetyKitId, expiryDate: addDays(20),    estimatedPricePerUnit: 1.80,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Liofilizaty obiadowe',         category: 'Food',      quantity: 10, unit: 'szt',   storageLocationId: basementId,  expiryDate: addYears(5),    estimatedPricePerUnit: 18.00, catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Kasza gryczana 2kg',           category: 'Food',      quantity: 4,  unit: 'kg',    storageLocationId: pantryId,    expiryDate: addYears(1),    estimatedPricePerUnit: 4.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Mleko UHT 1L',                category: 'Food',      quantity: 6,  unit: 'L',     storageLocationId: pantryId,    expiryDate: addMonths(4),   estimatedPricePerUnit: 2.80,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Sardynki — PRZETERMINOWANE',  category: 'Food',      quantity: 4,  unit: 'szt',   storageLocationId: pantryId,    expiryDate: addDays(-30),   estimatedPricePerUnit: 2.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Ibuprofen 400mg',             category: 'Medical',   quantity: 30, unit: 'tabl',  storageLocationId: pantryId,    expiryDate: addMonths(18),  estimatedPricePerUnit: 0.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Paracetamol 500mg',           category: 'Medical',   quantity: 20, unit: 'tabl',  storageLocationId: pantryId,    expiryDate: addMonths(24),  estimatedPricePerUnit: 0.30,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Bandaże elastyczne 10cm',     category: 'Medical',   quantity: 5,  unit: 'szt',   storageLocationId: carBagId,    expiryDate: addYears(5),    estimatedPricePerUnit: 3.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Gaza jałowa',                 category: 'Medical',   quantity: 10, unit: 'szt',   storageLocationId: safetyKitId, expiryDate: addYears(3),    estimatedPricePerUnit: 1.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Płyn antyseptyczny 250ml',    category: 'Medical',   quantity: 2,  unit: 'szt',   storageLocationId: pantryId,    expiryDate: addYears(2),    estimatedPricePerUnit: 8.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Rękawiczki jednorazowe',      category: 'Medical',   quantity: 50, unit: 'szt',   storageLocationId: safetyKitId, expiryDate: addYears(2),    estimatedPricePerUnit: 0.20,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Mydło w kostce',              category: 'Hygiene',   quantity: 10, unit: 'szt',   storageLocationId: basementId,  expiryDate: null,           estimatedPricePerUnit: 2.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Chusteczki nawilżane',        category: 'Hygiene',   quantity: 5,  unit: 'op',    storageLocationId: safetyKitId, expiryDate: addYears(2),    estimatedPricePerUnit: 6.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Papier toaletowy',            category: 'Hygiene',   quantity: 24, unit: 'rolek', storageLocationId: basementId,  expiryDate: null,           estimatedPricePerUnit: 1.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Baterie AA',                  category: 'Energy',    quantity: 24, unit: 'szt',   storageLocationId: pantryId,    expiryDate: addYears(7),    estimatedPricePerUnit: 1.20,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Baterie AAA',                 category: 'Energy',    quantity: 12, unit: 'szt',   storageLocationId: pantryId,    expiryDate: addYears(6),    estimatedPricePerUnit: 1.50,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Świece',                      category: 'Energy',    quantity: 20, unit: 'szt',   storageLocationId: basementId,  expiryDate: null,           estimatedPricePerUnit: 2.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Powerbank 20000mAh',          category: 'Energy',    quantity: 2,  unit: 'szt',   storageLocationId: carBagId,    expiryDate: null,           estimatedPricePerUnit: 80.00, catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Latarka LED z akumulatorem',  category: 'Energy',    quantity: 2,  unit: 'szt',   storageLocationId: carBagId,    expiryDate: null,           estimatedPricePerUnit: 35.00, catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Scyzoryk wielofunkcyjny',     category: 'Tools',     quantity: 1,  unit: 'szt',   storageLocationId: carBagId,    expiryDate: null,           estimatedPricePerUnit: 120.00,catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Taśma izolacyjna',            category: 'Tools',     quantity: 3,  unit: 'rolek', storageLocationId: basementId,  expiryDate: null,           estimatedPricePerUnit: 5.00,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Linka paracord 30m',          category: 'Tools',     quantity: 1,  unit: 'szt',   storageLocationId: safetyKitId, expiryDate: null,           estimatedPricePerUnit: 25.00, catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Radioodtwarzacz na baterie',  category: 'Tools',     quantity: 1,  unit: 'szt',   storageLocationId: basementId,  expiryDate: null,           estimatedPricePerUnit: 60.00, catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Kopie dokumentów (USB)',      category: 'Documents', quantity: 1,  unit: 'szt',   storageLocationId: safetyKitId, expiryDate: null,           estimatedPricePerUnit: null,  catalogItemName: null, addedAt: now },
    { id: newId(), name: 'Gotówka awaryjna',            category: 'Documents', quantity: 1,  unit: 'szt',   storageLocationId: safetyKitId, expiryDate: null,           estimatedPricePerUnit: null,  catalogItemName: null, addedAt: now }
  ] as SupplyRecord[]);

  const genId = newId(), extId = newId(), aidId = newId(), filterId = newId(), radioId = newId();
  await db.equipment.bulkAdd([
    { id: genId,    name: 'Generator prądotwórczy 2.5kW', category: 'Generator',       purchaseDate: '2022-06-01' },
    { id: extId,    name: 'Gaśnica proszkowa 6kg',        category: 'FireExtinguisher', purchaseDate: '2022-06-01' },
    { id: aidId,    name: 'Apteczka pierwszej pomocy',    category: 'FirstAid',         purchaseDate: '2022-06-01' },
    { id: filterId, name: 'Filtr do wody Dafi',           category: 'Filter',           purchaseDate: '2022-06-01' },
    { id: radioId,  name: 'Radiostacja Baofeng UV-5R',    category: 'Communication',    purchaseDate: '2022-06-01' }
  ] as EquipmentRecord[]);

  await db.maintenanceTasks.bulkAdd([
    { id: newId(), equipmentId: genId,    description: 'Przegląd roczny i wymiana oleju',      intervalDays: 365, lastCompletedAt: addDays(-60) },
    { id: newId(), equipmentId: genId,    description: 'Sprawdzenie paliwa i akumulatora',      intervalDays: 90,  lastCompletedAt: null },
    { id: newId(), equipmentId: extId,    description: 'Przegląd techniczny (UDT)',             intervalDays: 365, lastCompletedAt: addDays(-390) },
    { id: newId(), equipmentId: aidId,    description: 'Sprawdzenie dat ważności zawartości',   intervalDays: 180, lastCompletedAt: addDays(-10) },
    { id: newId(), equipmentId: filterId, description: 'Wymiana wkładu filtrującego',           intervalDays: 60,  lastCompletedAt: null },
    { id: newId(), equipmentId: radioId,  description: 'Sprawdzenie baterii i zasięgu',         intervalDays: 180, lastCompletedAt: addDays(-5) }
  ] as MaintenanceTaskRecord[]);

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
