using Bastion.Application.Supplies;
using Bastion.Domain.Aggregates.Supplies;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class SupplyRepository(AppDbContext db) : ISupplyRepository
{
    public async Task<IReadOnlyList<SupplyItem>> GetAllAsync(CancellationToken ct = default) =>
        await db.SupplyItems.ToListAsync(ct);

    public async Task<IReadOnlyList<(SupplyItem Item, string LocationName, string? LocationDesc)>> GetAllWithLocationAsync(CancellationToken ct = default) =>
        await db.SupplyItems
            .Join(db.StorageLocations,
                s => s.StorageLocationId,
                l => l.Id,
                (s, l) => new { Item = s, LocationName = l.Name, LocationDesc = l.Description })
            .OrderBy(x => x.Item.ExpiryDate)
            .Select(x => ValueTuple.Create(x.Item, x.LocationName, x.LocationDesc))
            .ToListAsync(ct);

    public async Task<(SupplyItem Item, string LocationName, string? LocationDesc)?> GetByIdWithLocationAsync(Guid id, CancellationToken ct = default)
    {
        var result = await db.SupplyItems
            .Where(s => s.Id == id)
            .Join(db.StorageLocations,
                s => s.StorageLocationId,
                l => l.Id,
                (s, l) => new { Item = s, LocationName = l.Name, LocationDesc = l.Description })
            .FirstOrDefaultAsync(ct);

        return result is null ? null : (result.Item, result.LocationName, result.LocationDesc);
    }

    public async Task<SupplyItem?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.SupplyItems.FindAsync([id], ct);

    public async Task AddAsync(SupplyItem item, CancellationToken ct = default)
    {
        db.SupplyItems.Add(item);
        await db.SaveChangesAsync(ct);
    }

    public async Task RemoveAsync(SupplyItem item, CancellationToken ct = default)
    {
        db.SupplyItems.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    public Task SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);

    public async Task<(string Name, string? Description)> GetLocationAsync(Guid locationId, CancellationToken ct = default)
    {
        var location = await db.StorageLocations.FindAsync([locationId], ct);
        return (location?.Name ?? string.Empty, location?.Description);
    }
}
