using Bastion.Domain.Aggregates.Equipment;
using Bastion.Domain.Aggregates.Households;
using Bastion.Domain.Aggregates.Locations;
using Bastion.Domain.Aggregates.Scenarios;
using Bastion.Domain.Aggregates.Supplies;
using Bastion.Domain.Aggregates.Targets;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        Household household;
        if (!await db.Households.AnyAsync())
        {
            household = Household.Create("Moje gospodarstwo domowe");
            household.AddMember("Adam", 38);
            household.AddMember("Marta", 36);
            household.AddMember("Kacper", 12);
            household.AddMember("Zosia", 8);
            db.Households.Add(household);
            await db.SaveChangesAsync();
        }
        else
        {
            household = await db.Households.FirstAsync();
        }

        StorageLocation pantry, basement, carBag, safetyKit;
        if (!await db.StorageLocations.AnyAsync())
        {
            pantry    = StorageLocation.Create("Spiżarnia",           "Główna spiżarnia w kuchni");
            basement  = StorageLocation.Create("Piwnica",             "Długoterminowe zapasy");
            carBag    = StorageLocation.Create("Torba w samochodzie", "EDC w bagażniku");
            safetyKit = StorageLocation.Create("Plecak ewakuacyjny",  "72h bug-out bag");
            db.StorageLocations.AddRange(pantry, basement, carBag, safetyKit);
            await db.SaveChangesAsync();
        }
        else
        {
            var locs = await db.StorageLocations.Take(4).ToListAsync();
            pantry    = locs[0];
            basement  = locs.Count > 1 ? locs[1] : locs[0];
            carBag    = locs.Count > 2 ? locs[2] : locs[0];
            safetyKit = locs.Count > 3 ? locs[3] : locs[0];
        }

        if (!await db.TargetLevels.AnyAsync())
        {
            var presets = new[]
            {
                TargetLevel.Create(household.Id, SupplyCategory.Water,     3m,    14, "L"),
                TargetLevel.Create(household.Id, SupplyCategory.Food,      0.5m,  14, "kg"),
                TargetLevel.Create(household.Id, SupplyCategory.Medical,   1m,    1,  "szt"),
                TargetLevel.Create(household.Id, SupplyCategory.Hygiene,   0.05m, 14, "kg"),
                TargetLevel.Create(household.Id, SupplyCategory.Energy,    0.5m,  14, "szt"),
                TargetLevel.Create(household.Id, SupplyCategory.Tools,     1m,    1,  "szt"),
                TargetLevel.Create(household.Id, SupplyCategory.Documents, 1m,    1,  "szt"),
            };
            db.TargetLevels.AddRange(presets);
            await db.SaveChangesAsync();
        }

        if (!await db.SupplyItems.AnyAsync())
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var supplies = new[]
            {
                // Water — 60 L total (target: 3L × 4 people × 14 days = 168 L, ~36% coverage)
                SupplyItem.Create("Woda źródlana 5L",              SupplyCategory.Water,    12m, "L",     pantry.Id,    today.AddYears(1),      1.50m),
                SupplyItem.Create("Woda mineralna 1.5L",           SupplyCategory.Water,     9m, "L",     basement.Id,  today.AddMonths(8),      1.20m),
                SupplyItem.Create("Tabletki do uzdatniania wody",   SupplyCategory.Water,    50m, "szt",   safetyKit.Id, today.AddDays(25),       0.20m),

                // Food — mix of good, expiring-soon, and expired
                SupplyItem.Create("Ryż biały 5kg",                 SupplyCategory.Food,      5m, "kg",    pantry.Id,    today.AddYears(2),       3.00m),
                SupplyItem.Create("Makaron penne 1kg",             SupplyCategory.Food,      3m, "kg",    pantry.Id,    today.AddMonths(15),     2.50m),
                SupplyItem.Create("Konserwy tuńczyk",              SupplyCategory.Food,     12m, "szt",   basement.Id,  today.AddYears(3),       3.50m),
                SupplyItem.Create("Batony energetyczne",           SupplyCategory.Food,     24m, "szt",   safetyKit.Id, today.AddDays(20),       1.80m),
                SupplyItem.Create("Liofilizaty obiadowe",          SupplyCategory.Food,     10m, "szt",   basement.Id,  today.AddYears(5),      18.00m),
                SupplyItem.Create("Kasza gryczana 2kg",            SupplyCategory.Food,      4m, "kg",    pantry.Id,    today.AddYears(1),       4.50m),
                SupplyItem.Create("Mleko UHT 1L",                  SupplyCategory.Food,      6m, "L",     pantry.Id,    today.AddMonths(4),      2.80m),
                SupplyItem.Create("Sardynki — PRZETERMINOWANE",    SupplyCategory.Food,      4m, "szt",   pantry.Id,    today.AddDays(-30),      2.00m),

                // Medical
                SupplyItem.Create("Ibuprofen 400mg",               SupplyCategory.Medical,  30m, "tabl",  pantry.Id,    today.AddMonths(18),     0.50m),
                SupplyItem.Create("Paracetamol 500mg",             SupplyCategory.Medical,  20m, "tabl",  pantry.Id,    today.AddMonths(24),     0.30m),
                SupplyItem.Create("Bandaże elastyczne 10cm",       SupplyCategory.Medical,   5m, "szt",   carBag.Id,    today.AddYears(5),       3.00m),
                SupplyItem.Create("Gaza jałowa",                   SupplyCategory.Medical,  10m, "szt",   safetyKit.Id, today.AddYears(3),       1.50m),
                SupplyItem.Create("Płyn antyseptyczny 250ml",      SupplyCategory.Medical,   2m, "szt",   pantry.Id,    today.AddYears(2),       8.00m),
                SupplyItem.Create("Rękawiczki jednorazowe",        SupplyCategory.Medical,  50m, "szt",   safetyKit.Id, today.AddYears(2),       0.20m),

                // Hygiene
                SupplyItem.Create("Mydło w kostce",                SupplyCategory.Hygiene,  10m, "szt",   basement.Id,  null,                    2.50m),
                SupplyItem.Create("Chusteczki nawilżane",          SupplyCategory.Hygiene,   5m, "op",    safetyKit.Id, today.AddYears(2),       6.00m),
                SupplyItem.Create("Papier toaletowy",              SupplyCategory.Hygiene,  24m, "rolek", basement.Id,  null,                    1.00m),

                // Energy
                SupplyItem.Create("Baterie AA",                    SupplyCategory.Energy,   24m, "szt",   pantry.Id,    today.AddYears(7),       1.20m),
                SupplyItem.Create("Baterie AAA",                   SupplyCategory.Energy,   12m, "szt",   pantry.Id,    today.AddYears(6),       1.50m),
                SupplyItem.Create("Świece zapachowe",              SupplyCategory.Energy,   20m, "szt",   basement.Id,  null,                    2.00m),
                SupplyItem.Create("Powerbank 20000mAh",            SupplyCategory.Energy,    2m, "szt",   carBag.Id,    null,                   80.00m),
                SupplyItem.Create("Latarka LED z akumulatorem",    SupplyCategory.Energy,    2m, "szt",   carBag.Id,    null,                   35.00m),

                // Tools
                SupplyItem.Create("Scyzoryk wielofunkcyjny",       SupplyCategory.Tools,     1m, "szt",   carBag.Id,    null,                  120.00m),
                SupplyItem.Create("Taśma izolacyjna",              SupplyCategory.Tools,     3m, "rolek", basement.Id,  null,                    5.00m),
                SupplyItem.Create("Linka paracord 30m",            SupplyCategory.Tools,     1m, "szt",   safetyKit.Id, null,                   25.00m),
                SupplyItem.Create("Radioodtwarzacz na baterie",    SupplyCategory.Tools,     1m, "szt",   basement.Id,  null,                   60.00m),

                // Documents
                SupplyItem.Create("Kopie dokumentów (USB)",        SupplyCategory.Documents, 1m, "szt",   safetyKit.Id, null,                   null),
                SupplyItem.Create("Gotówka awaryjna",              SupplyCategory.Documents, 1m, "szt",   safetyKit.Id, null,                   null),
            };
            db.SupplyItems.AddRange(supplies);
            await db.SaveChangesAsync();
        }

        if (!await db.Equipment.AnyAsync())
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var purchase = new DateOnly(2022, 6, 1);

            var generator = Equipment.Create("Generator prądotwórczy 2.5kW", EquipmentCategory.Generator, purchase, household.Id);
            var oilChange = generator.AddTask("Przegląd roczny i wymiana oleju", 365);
            oilChange.Complete(today.AddMonths(-2));   // current — next in 10 months
            generator.AddTask("Sprawdzenie paliwa i akumulatora", 90);  // overdue — never done

            var extinguisher = Equipment.Create("Gaśnica proszkowa 6kg", EquipmentCategory.FireExtinguisher, purchase, household.Id);
            var extCheck = extinguisher.AddTask("Przegląd techniczny (UDT)", 365);
            extCheck.Complete(today.AddMonths(-13));  // overdue by 1 month

            var firstAid = Equipment.Create("Apteczka pierwszej pomocy", EquipmentCategory.FirstAid, purchase, household.Id);
            var aidCheck = firstAid.AddTask("Sprawdzenie dat ważności zawartości", 180);
            aidCheck.Complete(today.AddDays(-10));    // current — next in ~5 months

            var filter = Equipment.Create("Filtr do wody Dafi", EquipmentCategory.Filter, purchase, household.Id);
            filter.AddTask("Wymiana wkładu filtrującego", 60);  // overdue — never done (purchase > 60 days ago)

            var radio = Equipment.Create("Radiostacja Baofeng UV-5R", EquipmentCategory.Communication, purchase, household.Id);
            var radioCheck = radio.AddTask("Sprawdzenie baterii i zasięgu", 180);
            radioCheck.Complete(today.AddDays(-5));   // current — next in ~6 months

            db.Equipment.AddRange(generator, extinguisher, firstAid, filter, radio);
            await db.SaveChangesAsync();
        }

        if (!await db.Scenarios.AnyAsync())
        {
            var powerOutage = Scenario.Create(household.Id,
                "Awaria prądu",
                "Kroki do wykonania w przypadku przerwy w dostawie energii elektrycznej.");
            powerOutage.AddItem("Uruchom generator lub przygotuj świece i latarki", 1);
            powerOutage.AddItem("Sprawdź stan paliwa w generatorze", 2);
            powerOutage.AddItem("Wyłącz zbędne urządzenia (ochrona przed przepięciem przy powrocie prądu)", 3);
            powerOutage.AddItem("Nie otwieraj lodówki bez potrzeby — żywność wytrzyma 4h", 4);
            powerOutage.AddItem("Naładuj powerbanki i urządzenia mobilne", 5);
            powerOutage.AddItem("Przełącz telefony w tryb oszczędzania energii", 6);
            powerOutage.AddItem("Włącz radioodtwarzacz — śledź komunikaty służb", 7);
            powerOutage.AddItem("Poinformuj rodzinę i sąsiadów o sytuacji", 8);

            var evacuation = Scenario.Create(household.Id,
                "Ewakuacja",
                "Plan ewakuacji z domu — gdy grozi niebezpieczeństwo i trzeba szybko opuścić nieruchomość.");
            evacuation.AddItem("Zabierz plecak ewakuacyjny (gotowy, stoi przy drzwiach)", 1);
            evacuation.AddItem("Dokumenty: dowód, paszport, polisy ubezpieczeniowe, prawo jazdy", 2);
            evacuation.AddItem("Leki na min. 7 dni i apteczka pierwszej pomocy", 3);
            evacuation.AddItem("Woda (min. 2L/os) i żywność na 72h", 4);
            evacuation.AddItem("Odzież na 3 dni i zmiana dla dzieci", 5);
            evacuation.AddItem("Ładowarki, powerbanki, latarka, radio na baterie", 6);
            evacuation.AddItem("Wyłącz gaz, wodę i prąd (główne zawory/bezpieczniki)", 7);
            evacuation.AddItem("Zabezpiecz zwierzęta — nosidło, smycz, jedzenie", 8);
            evacuation.AddItem("Poinformuj bliskich o miejscu docelowym i trasie", 9);
            evacuation.AddItem("Zamknij i zabezpiecz dom", 10);

            var noWater = Scenario.Create(household.Id,
                "Brak wody w kranie",
                "Postępowanie w przypadku przerwy w dostawie wody wodociągowej.");
            noWater.AddItem("Sprawdź zapasy wody butelkowanej w spiżarni i piwnicy", 1);
            noWater.AddItem("Napełnij wannę i duże pojemniki, jeśli ciśnienie jeszcze jest", 2);
            noWater.AddItem("Ogranicz zużycie — priorytet: picie i gotowanie", 3);
            noWater.AddItem("Uruchom filtr do wody (woda deszczowa, studnia)", 4);
            noWater.AddItem("Użyj tabletek do uzdatniania wody przy niepewnym źródle", 5);
            noWater.AddItem("Zadzwoń na awaryjny numer wodociągów", 6);

            var firstAidCheck = Scenario.Create(household.Id,
                "Kontrola apteczki — cykliczna",
                "Rutynowa kontrola apteczek domowych. Wykonywać co 6 miesięcy.");
            firstAidCheck.AddItem("Sprawdź daty ważności leków — wyrzuć przeterminowane", 1);
            firstAidCheck.AddItem("Uzupełnij zużyte opatrunki, bandaże i plastry", 2);
            firstAidCheck.AddItem("Sprawdź stan rękawiczek jednorazowych (czy nie kruche)", 3);
            firstAidCheck.AddItem("Uzupełnij płyn antyseptyczny", 4);
            firstAidCheck.AddItem("Sprawdź czytelność instrukcji pierwszej pomocy", 5);
            firstAidCheck.AddItem("Zaktualizuj listę leków alergicznych w rodzinie", 6);

            db.Scenarios.AddRange(powerOutage, evacuation, noWater, firstAidCheck);
            await db.SaveChangesAsync();
        }
    }
}
