using Bastion.Domain.Aggregates.Catalog;
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

        if (!await db.StorageLocations.AnyAsync())
        {
            db.StorageLocations.AddRange(
                StorageLocation.Create("Spiżarnia",           "Główna spiżarnia w kuchni"),
                StorageLocation.Create("Piwnica",             "Długoterminowe zapasy"),
                StorageLocation.Create("Torba w samochodzie", "EDC w bagażniku"),
                StorageLocation.Create("Plecak ewakuacyjny",  "72h bug-out bag")
            );
            await db.SaveChangesAsync();
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

        if (!await db.SupplyCatalog.AnyAsync())
        {
            db.SupplyCatalog.AddRange(
                SupplyCatalogItem.Create("Woda mineralna",                          SupplyCategory.Water,     "L",      42m),
                SupplyCatalogItem.Create("Tabletki do uzdatniania wody",            SupplyCategory.Water,     "szt",    50m),
                SupplyCatalogItem.Create("Filtr do wody (Brita/BWT)",               SupplyCategory.Water,     "szt",     1m),
                SupplyCatalogItem.Create("Konserwy mięsne",                         SupplyCategory.Food,      "szt",    20m),
                SupplyCatalogItem.Create("Konserwy rybne",                          SupplyCategory.Food,      "szt",    10m),
                SupplyCatalogItem.Create("Makaron",                                 SupplyCategory.Food,      "kg",      5m),
                SupplyCatalogItem.Create("Ryż",                                     SupplyCategory.Food,      "kg",      5m),
                SupplyCatalogItem.Create("Kasza gryczana",                          SupplyCategory.Food,      "kg",      3m),
                SupplyCatalogItem.Create("Mąka pszenna",                            SupplyCategory.Food,      "kg",      3m),
                SupplyCatalogItem.Create("Cukier",                                  SupplyCategory.Food,      "kg",      2m),
                SupplyCatalogItem.Create("Sól",                                     SupplyCategory.Food,      "kg",      1m),
                SupplyCatalogItem.Create("Olej roślinny",                           SupplyCategory.Food,      "L",       2m),
                SupplyCatalogItem.Create("Miód",                                    SupplyCategory.Food,      "kg",      1m),
                SupplyCatalogItem.Create("Herbata",                                 SupplyCategory.Food,      "op",      3m),
                SupplyCatalogItem.Create("Orzechy i suszone owoce",                 SupplyCategory.Food,      "kg",      1m),
                SupplyCatalogItem.Create("Dżem / marmolada",                        SupplyCategory.Food,      "szt",     4m),
                SupplyCatalogItem.Create("Bandaże elastyczne",                      SupplyCategory.Medical,   "szt",     4m),
                SupplyCatalogItem.Create("Gaza jałowa",                             SupplyCategory.Medical,   "szt",    10m),
                SupplyCatalogItem.Create("Plastry (zestaw)",                        SupplyCategory.Medical,   "op",      2m),
                SupplyCatalogItem.Create("Środek odkażający (Octenisept)",          SupplyCategory.Medical,   "szt",     1m),
                SupplyCatalogItem.Create("Ibuprofen / Paracetamol",                 SupplyCategory.Medical,   "op",      2m),
                SupplyCatalogItem.Create("Rękawice jednorazowe",                    SupplyCategory.Medical,   "par",    20m),
                SupplyCatalogItem.Create("Termometr",                               SupplyCategory.Medical,   "szt",     1m),
                SupplyCatalogItem.Create("Papier toaletowy",                        SupplyCategory.Hygiene,   "rolki",  40m),
                SupplyCatalogItem.Create("Mydło",                                   SupplyCategory.Hygiene,   "szt",     6m),
                SupplyCatalogItem.Create("Pasta do zębów",                          SupplyCategory.Hygiene,   "szt",     3m),
                SupplyCatalogItem.Create("Żel / płyn dezynfekujący do rąk",        SupplyCategory.Hygiene,   "szt",     2m),
                SupplyCatalogItem.Create("Mokre chusteczki",                        SupplyCategory.Hygiene,   "op",      5m),
                SupplyCatalogItem.Create("Świece",                                  SupplyCategory.Energy,    "szt",    10m),
                SupplyCatalogItem.Create("Zapałki",                                 SupplyCategory.Energy,    "szt",     5m),
                SupplyCatalogItem.Create("Latarka LED",                             SupplyCategory.Energy,    "szt",     2m),
                SupplyCatalogItem.Create("Baterie AA",                              SupplyCategory.Energy,    "szt",    12m),
                SupplyCatalogItem.Create("Powerbank",                               SupplyCategory.Energy,    "szt",     1m),
                SupplyCatalogItem.Create("Nóż wielofunkcyjny",                      SupplyCategory.Tools,     "szt",     1m),
                SupplyCatalogItem.Create("Lina (10 m)",                             SupplyCategory.Tools,     "szt",     1m),
                SupplyCatalogItem.Create("Taśma klejąca / duct tape",              SupplyCategory.Tools,     "szt",     2m),
                SupplyCatalogItem.Create("Radio na baterie",                        SupplyCategory.Tools,     "szt",     1m),
                SupplyCatalogItem.Create("Kopie dokumentów (wodoszczelne opakowanie)", SupplyCategory.Documents, "kpl",  1m),
                SupplyCatalogItem.Create("Gotówka awaryjna",                        SupplyCategory.Documents, "kpl",     1m)
            );
            await db.SaveChangesAsync();
        }

        if (!await db.EquipmentCatalog.AnyAsync())
        {
            db.EquipmentCatalog.AddRange(
                EquipmentCatalogItem.Create("Gaśnica proszkowa (ABC)",         EquipmentCategory.FireExtinguisher, "Pożary klasy A, B, C — do każdego pomieszczenia"),
                EquipmentCatalogItem.Create("Gaśnica CO₂",                     EquipmentCategory.FireExtinguisher, "Urządzenia elektryczne i sprzęt RTV"),
                EquipmentCatalogItem.Create("Koc gaśniczy",                    EquipmentCategory.FireExtinguisher, "Małe pożary i osoba z płonącą odzieżą"),
                EquipmentCatalogItem.Create("Apteczka domowa (duża)",          EquipmentCategory.FirstAid,         "Pełny zestaw opatrunków i leków pierwszej pomocy"),
                EquipmentCatalogItem.Create("Agregat prądotwórczy",            EquipmentCategory.Generator,        "Awaryjne źródło prądu na wypadek blackoutu"),
                EquipmentCatalogItem.Create("Powerbank stacjonarny (≥100Wh)", EquipmentCategory.Generator,        "Zasilanie laptopa i lamp LED przez kilka dni"),
                EquipmentCatalogItem.Create("Panel solarny z inverterem",      EquipmentCategory.Generator,        "Odnawialne źródło energii niezależne od sieci"),
                EquipmentCatalogItem.Create("UPS",                             EquipmentCategory.Generator,        "Podtrzymanie routera i komputera przy przerwie"),
                EquipmentCatalogItem.Create("Radio kryzysowe (DAB+/FM)",      EquipmentCategory.Communication,    "Alarmy RCB i komunikaty bez internetu"),
                EquipmentCatalogItem.Create("Walkie-talkie",                   EquipmentCategory.Communication,    "Łączność w obrębie kilku km bez infrastruktury"),
                EquipmentCatalogItem.Create("Radio CB",                        EquipmentCategory.Communication,    "Łączność na 27 MHz z kierowcami i służbami"),
                EquipmentCatalogItem.Create("Filtr do wody (grawitacyjny)",   EquipmentCategory.Filter,           "Oczyszczanie wody bez pompy ani prądu"),
                EquipmentCatalogItem.Create("Pompka filtrująca (turystyczna)", EquipmentCategory.Filter,           "Filtrowanie wody ze strumienia lub jeziora"),
                EquipmentCatalogItem.Create("Łopata",                          EquipmentCategory.Tools,            "Odśnieżanie, kopanie, tłumienie ognia zewnętrznego"),
                EquipmentCatalogItem.Create("Siekiera",                        EquipmentCategory.Tools,            "Rąbanie drewna na opał i ewakuacja z zablokowanych pomieszczeń"),
                EquipmentCatalogItem.Create("Piła ręczna",                     EquipmentCategory.Tools,            "Cięcie drewna i usuwanie powałów bez prądu"),
                EquipmentCatalogItem.Create("Multitool",                       EquipmentCategory.Tools,            "Wielofunkcyjne narzędzie do napraw w terenie"),
                EquipmentCatalogItem.Create("Drabina składana",                EquipmentCategory.Tools,            "Ewakuacja z górnych pięter i dostęp do dachu"),
                EquipmentCatalogItem.Create("Samochód",                        EquipmentCategory.Vehicle,          "Ewakuacja rodziny i transport zapasów"),
                EquipmentCatalogItem.Create("Rower",                           EquipmentCategory.Vehicle,          "Transport przy braku paliwa lub zablokowanych drogach"),
                EquipmentCatalogItem.Create("Czujnik dymu",                    EquipmentCategory.Other,            "Wczesne wykrycie pożaru — obowiązkowy w każdym pomieszczeniu"),
                EquipmentCatalogItem.Create("Czujnik tlenku węgla (CO)",      EquipmentCategory.Other,            "Ochrona życia przy urządzeniach gazowych i kominku"),
                EquipmentCatalogItem.Create("Latarka czołowa",                 EquipmentCategory.Other,            "Obie ręce wolne przy pracy i ewakuacji po ciemku")
            );
            await db.SaveChangesAsync();
        }
    }
}
