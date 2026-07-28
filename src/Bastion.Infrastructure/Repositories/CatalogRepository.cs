using Bastion.Application.Catalog;
using Bastion.Domain.Aggregates.Catalog;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class CatalogRepository(AppDbContext db) : ICatalogRepository
{
    public async Task<IReadOnlyList<SupplyCatalogItem>> GetAllSupplyItemsAsync(CancellationToken ct = default)
        => await db.SupplyCatalog.OrderBy(x => x.Category).ThenBy(x => x.Name).ToListAsync(ct);

    public async Task<IReadOnlyList<EquipmentCatalogItem>> GetAllEquipmentItemsAsync(CancellationToken ct = default)
        => await db.EquipmentCatalog.OrderBy(x => x.Category).ThenBy(x => x.Name).ToListAsync(ct);

    public async Task<SupplyCatalogItem?> GetSupplyItemByIdAsync(Guid id, CancellationToken ct = default)
        => await db.SupplyCatalog.FindAsync([id], ct);

    public async Task<EquipmentCatalogItem?> GetEquipmentItemByIdAsync(Guid id, CancellationToken ct = default)
        => await db.EquipmentCatalog.FindAsync([id], ct);

    public async Task SaveAsync(CancellationToken ct = default)
        => await db.SaveChangesAsync(ct);
}
