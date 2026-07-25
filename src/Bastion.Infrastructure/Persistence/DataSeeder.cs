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
    }
}
