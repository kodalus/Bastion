using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Supplies;

public class SupplyItem : Entity
{
    public string Name { get; private set; } = string.Empty;
    public SupplyCategory Category { get; private set; }
    public decimal Quantity { get; private set; }
    public string Unit { get; private set; } = string.Empty;
    public Guid StorageLocationId { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public decimal? EstimatedPricePerUnit { get; private set; }
    public string? CatalogItemName { get; private set; }
    public DateTime AddedAt { get; private init; } = DateTime.UtcNow;

    private SupplyItem() { }

    public static SupplyItem Create(
        string name,
        SupplyCategory category,
        decimal quantity,
        string unit,
        Guid storageLocationId,
        DateOnly? expiryDate = null,
        decimal? estimatedPricePerUnit = null,
        string? catalogItemName = null) =>
        new()
        {
            Name = name,
            Category = category,
            Quantity = quantity,
            Unit = unit,
            StorageLocationId = storageLocationId,
            ExpiryDate = expiryDate,
            EstimatedPricePerUnit = estimatedPricePerUnit,
            CatalogItemName = catalogItemName
        };

    public void Update(
        string name,
        SupplyCategory category,
        decimal quantity,
        string unit,
        Guid storageLocationId,
        DateOnly? expiryDate,
        decimal? estimatedPricePerUnit,
        string? catalogItemName)
    {
        Name = name;
        Category = category;
        Quantity = quantity;
        Unit = unit;
        StorageLocationId = storageLocationId;
        ExpiryDate = expiryDate;
        EstimatedPricePerUnit = estimatedPricePerUnit;
        CatalogItemName = catalogItemName;
        MarkUpdated();
    }

    public bool IsExpired(DateOnly today) =>
        ExpiryDate.HasValue && ExpiryDate.Value < today;

    public bool IsExpiringSoon(DateOnly today, int withinDays) =>
        ExpiryDate.HasValue &&
        ExpiryDate.Value >= today &&
        ExpiryDate.Value <= today.AddDays(withinDays);
}
