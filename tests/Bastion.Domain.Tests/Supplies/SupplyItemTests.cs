using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Domain.Tests.Supplies;

public class SupplyItemTests
{
    private static readonly Guid LocationId = Guid.NewGuid();

    [Fact]
    public void Create_SetsAllProperties()
    {
        var expiry = new DateOnly(2027, 1, 1);
        var item = SupplyItem.Create("Water 1.5L", SupplyCategory.Water, 12, "szt", LocationId, expiry, 1.50m);

        Assert.Equal("Water 1.5L", item.Name);
        Assert.Equal(SupplyCategory.Water, item.Category);
        Assert.Equal(12, item.Quantity);
        Assert.Equal("szt", item.Unit);
        Assert.Equal(LocationId, item.StorageLocationId);
        Assert.Equal(expiry, item.ExpiryDate);
        Assert.Equal(1.50m, item.EstimatedPricePerUnit);
    }

    [Fact]
    public void IsExpired_ReturnsFalse_WhenExpiryIsNull()
    {
        var item = SupplyItem.Create("Salt", SupplyCategory.Food, 1, "kg", LocationId);
        Assert.False(item.IsExpired(DateOnly.FromDateTime(DateTime.UtcNow)));
    }

    [Fact]
    public void IsExpired_ReturnsTrue_WhenExpiryIsInThePast()
    {
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var item = SupplyItem.Create("Old meds", SupplyCategory.Medical, 1, "szt", LocationId, yesterday);

        Assert.True(item.IsExpired(DateOnly.FromDateTime(DateTime.UtcNow)));
    }

    [Fact]
    public void IsExpired_ReturnsFalse_WhenExpiryIsToday()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var item = SupplyItem.Create("Item", SupplyCategory.Food, 1, "szt", LocationId, today);

        Assert.False(item.IsExpired(today));
    }

    [Fact]
    public void IsExpiringSoon_ReturnsTrue_WhenWithinWindow()
    {
        var soon = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15));
        var item = SupplyItem.Create("Bandages", SupplyCategory.Medical, 1, "szt", LocationId, soon);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        Assert.True(item.IsExpiringSoon(today, 30));
    }

    [Fact]
    public void IsExpiringSoon_ReturnsFalse_WhenBeyondWindow()
    {
        var farFuture = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(60));
        var item = SupplyItem.Create("Canned beans", SupplyCategory.Food, 1, "szt", LocationId, farFuture);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        Assert.False(item.IsExpiringSoon(today, 30));
    }

    [Fact]
    public void IsExpiringSoon_ReturnsFalse_WhenAlreadyExpired()
    {
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var item = SupplyItem.Create("Expired", SupplyCategory.Medical, 1, "szt", LocationId, yesterday);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        Assert.False(item.IsExpiringSoon(today, 30));
    }

    [Fact]
    public void Update_ChangesProperties()
    {
        var item = SupplyItem.Create("Water", SupplyCategory.Water, 10, "L", LocationId);
        var newLocation = Guid.NewGuid();
        var newExpiry = new DateOnly(2028, 6, 1);

        item.Update("Mineral water", SupplyCategory.Water, 20, "L", newLocation, newExpiry, 2.00m);

        Assert.Equal("Mineral water", item.Name);
        Assert.Equal(20, item.Quantity);
        Assert.Equal(newLocation, item.StorageLocationId);
        Assert.Equal(newExpiry, item.ExpiryDate);
    }
}
