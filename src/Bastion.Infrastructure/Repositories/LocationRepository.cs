using Bastion.Application.Locations;
using Bastion.Domain.Aggregates.Locations;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class LocationRepository(AppDbContext db) : ILocationRepository
{
    public async Task<IReadOnlyList<StorageLocation>> GetAllAsync(CancellationToken ct = default) =>
        await db.StorageLocations.OrderBy(l => l.Name).ToListAsync(ct);

    public async Task<StorageLocation?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.StorageLocations.FindAsync([id], ct);

    public async Task AddAsync(StorageLocation location, CancellationToken ct = default)
    {
        db.StorageLocations.Add(location);
        await db.SaveChangesAsync(ct);
    }

    public async Task RemoveAsync(StorageLocation location, CancellationToken ct = default)
    {
        db.StorageLocations.Remove(location);
        await db.SaveChangesAsync(ct);
    }

    public Task SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
