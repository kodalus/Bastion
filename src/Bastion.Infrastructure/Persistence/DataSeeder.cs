using Bastion.Domain.Aggregates.Equipment;
using Bastion.Domain.Aggregates.Households;
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
            household.AddMember("Osoba 1", 35);
            household.AddMember("Osoba 2", 33);
            household.AddMember("Osoba 3", 10);
            household.AddMember("Osoba 4", 7);
            db.Households.Add(household);
            await db.SaveChangesAsync();
        }
        else
        {
            household = await db.Households.FirstAsync();
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

        if (!await db.Equipment.AnyAsync())
        {
            var purchaseDate = new DateOnly(2023, 1, 1);

            var generator = Equipment.Create("Generator prądotwórczy", EquipmentCategory.Generator, purchaseDate, household.Id);
            generator.AddTask("Przegląd roczny i wymiana oleju", 365);
            generator.AddTask("Sprawdzenie paliwa i akumulatora", 90);

            var extinguisher = Equipment.Create("Gaśnica proszkowa 6kg", EquipmentCategory.FireExtinguisher, purchaseDate, household.Id);
            extinguisher.AddTask("Przegląd techniczny", 365);

            var firstAid = Equipment.Create("Apteczka pierwszej pomocy", EquipmentCategory.FirstAid, purchaseDate, household.Id);
            firstAid.AddTask("Sprawdzenie dat ważności zawartości", 180);

            var filter = Equipment.Create("Filtr do wody Dafi", EquipmentCategory.Filter, purchaseDate, household.Id);
            filter.AddTask("Wymiana wkładu filtrującego", 60);

            db.Equipment.AddRange(generator, extinguisher, firstAid, filter);
            await db.SaveChangesAsync();
        }
    }
}
