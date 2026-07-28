using Bastion.Domain.Aggregates.Catalog;
using Bastion.Domain.Aggregates.Equipment;
using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Application.Catalog;

public record SupplyCatalogItemDto(Guid Id, string Name, SupplyCategory Category, string Unit, decimal SuggestedQty, decimal? Price);
public record EquipmentCatalogItemDto(Guid Id, string Name, EquipmentCategory Category, string Hint, decimal? Price);
public record SetPriceRequest(decimal? Price);

public interface ICatalogService
{
    Task<IReadOnlyList<SupplyCatalogItemDto>> GetSupplyItemsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<EquipmentCatalogItemDto>> GetEquipmentItemsAsync(CancellationToken ct = default);
    Task<bool> SetSupplyPriceAsync(Guid id, decimal? price, CancellationToken ct = default);
    Task<bool> SetEquipmentPriceAsync(Guid id, decimal? price, CancellationToken ct = default);
}

public interface ICatalogRepository
{
    Task<IReadOnlyList<SupplyCatalogItem>> GetAllSupplyItemsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<EquipmentCatalogItem>> GetAllEquipmentItemsAsync(CancellationToken ct = default);
    Task<SupplyCatalogItem?> GetSupplyItemByIdAsync(Guid id, CancellationToken ct = default);
    Task<EquipmentCatalogItem?> GetEquipmentItemByIdAsync(Guid id, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}

public class CatalogService(ICatalogRepository repo) : ICatalogService
{
    public async Task<IReadOnlyList<SupplyCatalogItemDto>> GetSupplyItemsAsync(CancellationToken ct = default)
    {
        var items = await repo.GetAllSupplyItemsAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<EquipmentCatalogItemDto>> GetEquipmentItemsAsync(CancellationToken ct = default)
    {
        var items = await repo.GetAllEquipmentItemsAsync(ct);
        return items.Select(ToDto).ToList();
    }

    public async Task<bool> SetSupplyPriceAsync(Guid id, decimal? price, CancellationToken ct = default)
    {
        var item = await repo.GetSupplyItemByIdAsync(id, ct);
        if (item is null) return false;
        item.SetPrice(price);
        await repo.SaveAsync(ct);
        return true;
    }

    public async Task<bool> SetEquipmentPriceAsync(Guid id, decimal? price, CancellationToken ct = default)
    {
        var item = await repo.GetEquipmentItemByIdAsync(id, ct);
        if (item is null) return false;
        item.SetPrice(price);
        await repo.SaveAsync(ct);
        return true;
    }

    private static SupplyCatalogItemDto ToDto(SupplyCatalogItem i)
        => new(i.Id, i.Name, i.Category, i.Unit, i.SuggestedQty, i.Price);

    private static EquipmentCatalogItemDto ToDto(EquipmentCatalogItem i)
        => new(i.Id, i.Name, i.Category, i.Hint, i.Price);
}
