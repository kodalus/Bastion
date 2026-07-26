using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Application.Supplies.Dtos;

public record SupplyItemDto(
    Guid Id,
    string Name,
    SupplyCategory Category,
    decimal Quantity,
    string Unit,
    Guid StorageLocationId,
    string StorageLocationName,
    string? StorageLocationDescription,
    DateOnly? ExpiryDate,
    decimal? EstimatedPricePerUnit,
    string? CatalogItemName,
    DateTime AddedAt,
    bool IsExpired,
    bool IsExpiringSoon);

public record CreateSupplyItemRequest(
    string Name,
    SupplyCategory Category,
    decimal Quantity,
    string Unit,
    Guid StorageLocationId,
    DateOnly? ExpiryDate,
    decimal? EstimatedPricePerUnit,
    string? CatalogItemName = null);

public record UpdateSupplyItemRequest(
    string Name,
    SupplyCategory Category,
    decimal Quantity,
    string Unit,
    Guid StorageLocationId,
    DateOnly? ExpiryDate,
    decimal? EstimatedPricePerUnit,
    string? CatalogItemName = null);
