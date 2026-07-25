using Bastion.Application.Supplies.Dtos;
using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Application.Supplies;

public interface ISupplyService
{
    Task<IReadOnlyList<SupplyItemDto>> GetAllAsync(CancellationToken ct = default);
    Task<SupplyItemDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SupplyItemDto> CreateAsync(CreateSupplyItemRequest request, CancellationToken ct = default);
    Task<SupplyItemDto?> UpdateAsync(Guid id, UpdateSupplyItemRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}

public class SupplyService(ISupplyRepository repository) : ISupplyService
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);
    private const int ExpirySoonDays = 30;

    public async Task<IReadOnlyList<SupplyItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await repository.GetAllWithLocationAsync(ct);
        return items.Select(x => ToDto(x.Item, x.LocationName)).ToList();
    }

    public async Task<SupplyItemDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var result = await repository.GetByIdWithLocationAsync(id, ct);
        return result is null ? null : ToDto(result.Value.Item, result.Value.LocationName);
    }

    public async Task<SupplyItemDto> CreateAsync(CreateSupplyItemRequest request, CancellationToken ct = default)
    {
        var item = SupplyItem.Create(
            request.Name, request.Category, request.Quantity,
            request.Unit, request.StorageLocationId,
            request.ExpiryDate, request.EstimatedPricePerUnit);
        await repository.AddAsync(item, ct);
        var locationName = await repository.GetLocationNameAsync(item.StorageLocationId, ct);
        return ToDto(item, locationName);
    }

    public async Task<SupplyItemDto?> UpdateAsync(Guid id, UpdateSupplyItemRequest request, CancellationToken ct = default)
    {
        var item = await repository.GetByIdAsync(id, ct);
        if (item is null) return null;
        item.Update(request.Name, request.Category, request.Quantity,
            request.Unit, request.StorageLocationId,
            request.ExpiryDate, request.EstimatedPricePerUnit);
        await repository.SaveAsync(ct);
        var locationName = await repository.GetLocationNameAsync(item.StorageLocationId, ct);
        return ToDto(item, locationName);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var item = await repository.GetByIdAsync(id, ct);
        if (item is null) return false;
        await repository.RemoveAsync(item, ct);
        return true;
    }

    private static SupplyItemDto ToDto(SupplyItem item, string locationName)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return new SupplyItemDto(
            item.Id, item.Name, item.Category,
            item.Quantity, item.Unit,
            item.StorageLocationId, locationName,
            item.ExpiryDate, item.EstimatedPricePerUnit,
            item.AddedAt,
            item.IsExpired(today),
            item.IsExpiringSoon(today, ExpirySoonDays));
    }
}

public interface ISupplyRepository
{
    Task<IReadOnlyList<(SupplyItem Item, string LocationName)>> GetAllWithLocationAsync(CancellationToken ct = default);
    Task<(SupplyItem Item, string LocationName)?> GetByIdWithLocationAsync(Guid id, CancellationToken ct = default);
    Task<SupplyItem?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(SupplyItem item, CancellationToken ct = default);
    Task RemoveAsync(SupplyItem item, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    Task<string> GetLocationNameAsync(Guid locationId, CancellationToken ct = default);
}
