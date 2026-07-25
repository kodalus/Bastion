using Bastion.Domain.Aggregates.Supplies;
using Bastion.Domain.Aggregates.Targets;

namespace Bastion.Domain.Tests.Targets;

public class ReadinessScoreTests
{
    private static readonly Guid HouseholdId = Guid.NewGuid();
    private static readonly Guid LocationId = Guid.NewGuid();
    private static readonly DateOnly Today = new(2026, 7, 25);

    private static SupplyItem MakeItem(SupplyCategory cat, decimal qty, DateOnly? expiry = null, decimal? price = null) =>
        SupplyItem.Create($"Item-{cat}", cat, qty, "L", LocationId, expiry, price);

    private static TargetLevel MakeTarget(SupplyCategory cat, decimal qppd, int horizon = 14) =>
        TargetLevel.Create(HouseholdId, cat, qppd, horizon, "L");

    // --- No targets ---

    [Fact]
    public void NoTargets_ReturnsZeroScore_EmptyLists()
    {
        var result = ReadinessScoreService.Calculate([], [], memberCount: 4, Today);

        Assert.Equal(0, result.OverallScore);
        Assert.Empty(result.CategoryScores);
        Assert.Empty(result.ShoppingList);
    }

    // --- Full coverage ---

    [Fact]
    public void AllCategoriesFullyStocked_ReturnsOverallScore100_NoShoppingList()
    {
        // Target: 3 L/person/day × 14 days × 4 people = 168 L
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var item = MakeItem(SupplyCategory.Water, 168m);

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 4, Today);

        Assert.Equal(100, result.OverallScore);
        Assert.Single(result.CategoryScores);
        Assert.Equal(100, result.CategoryScores[0].Score);
        Assert.Empty(result.ShoppingList);
    }

    // --- No supplies ---

    [Fact]
    public void NoSupplies_CategoryScore0_WholeGapInShoppingList()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);

        var result = ReadinessScoreService.Calculate([], [target], memberCount: 4, Today);

        Assert.Equal(0, result.OverallScore);
        Assert.Equal(0, result.CategoryScores[0].Score);
        Assert.Single(result.ShoppingList);
        Assert.Equal(168m, result.ShoppingList[0].Gap); // 3 × 14 × 4
    }

    // --- Partial coverage ---

    [Fact]
    public void PartialCoverage_ReturnsProportionalScore()
    {
        // Required: 3 × 14 × 4 = 168 L. Have 84 L → 50%
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var item = MakeItem(SupplyCategory.Water, 84m);

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 4, Today);

        Assert.Equal(50, result.CategoryScores[0].Score);
        Assert.Equal(84m, result.ShoppingList[0].Gap);
    }

    // --- Expired items ---

    [Fact]
    public void ExpiredItems_ContributeZero_ToCategoryScore()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 1);
        var expiredItem = MakeItem(SupplyCategory.Water, 100m, expiry: Today.AddDays(-1));

        var result = ReadinessScoreService.Calculate([expiredItem], [target], memberCount: 1, Today);

        Assert.Equal(0, result.CategoryScores[0].Score);
        Assert.Equal(0m, result.CategoryScores[0].Available);
    }

    [Fact]
    public void ItemExpiringToday_CountsAtHalfWeight_NotZero()
    {
        // Expiry == Today → not expired (ExpiryDate < today is false), but IS expiring soon → 50% weight
        var target = MakeTarget(SupplyCategory.Water, 3m, 1);
        var item = MakeItem(SupplyCategory.Water, 3m, expiry: Today);

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 1, Today);

        // 3 × 0.5 = 1.5 effective vs required 3 → 50%
        Assert.Equal(1.5m, result.CategoryScores[0].Available);
        Assert.Equal(50, result.CategoryScores[0].Score);
    }

    // --- Expiring soon items ---

    [Fact]
    public void ExpiringSoonItems_CountAtHalfWeight()
    {
        // Required: 3 × 14 × 1 = 42. Item has 42 but expires in 15 days → 21 effective → 50%
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var soonItem = MakeItem(SupplyCategory.Water, 42m, expiry: Today.AddDays(15));

        var result = ReadinessScoreService.Calculate([soonItem], [target], memberCount: 1, Today);

        Assert.Equal(21m, result.CategoryScores[0].Available);
        Assert.Equal(50, result.CategoryScores[0].Score);
    }

    [Fact]
    public void MixedItems_SumCorrectly()
    {
        // Required: 3 × 14 × 1 = 42.
        // Fresh 20, SoonExpiry 10 (→ 5 effective), Expired 100 (→ 0). Total effective = 25 → ~60%
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var fresh = MakeItem(SupplyCategory.Water, 20m);
        var soon = MakeItem(SupplyCategory.Water, 10m, expiry: Today.AddDays(10));
        var expired = MakeItem(SupplyCategory.Water, 100m, expiry: Today.AddDays(-1));

        var result = ReadinessScoreService.Calculate([fresh, soon, expired], [target], memberCount: 1, Today);

        Assert.Equal(25m, result.CategoryScores[0].Available); // 20 + 5 + 0
        Assert.Equal(60, result.CategoryScores[0].Score);      // 25/42 × 100 ≈ 60
    }

    // --- Score capped at 100 ---

    [Fact]
    public void OverstockedCategory_ScoreCapsAt100()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var item = MakeItem(SupplyCategory.Water, 1000m); // way over required

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 4, Today);

        Assert.Equal(100, result.CategoryScores[0].Score);
        Assert.Equal(100, result.OverallScore);
        Assert.Empty(result.ShoppingList);
    }

    // --- Shopping list priorities ---

    [Fact]
    public void ShoppingList_OrderedByPriority_HighFirst()
    {
        var targets = new[]
        {
            MakeTarget(SupplyCategory.Tools, 1m, 1),      // Low
            MakeTarget(SupplyCategory.Food, 0.5m, 14),    // High
            MakeTarget(SupplyCategory.Energy, 0.5m, 14),  // Medium
            MakeTarget(SupplyCategory.Water, 3m, 14),     // High
        };

        var result = ReadinessScoreService.Calculate([], targets, memberCount: 2, Today);

        var priorities = result.ShoppingList.Select(i => i.Priority).ToList();
        Assert.Equal(ShoppingPriority.High, priorities[0]);
        Assert.Equal(ShoppingPriority.High, priorities[1]);
        Assert.Equal(ShoppingPriority.Medium, priorities[2]);
        Assert.Equal(ShoppingPriority.Low, priorities[3]);
    }

    [Fact]
    public void Water_Food_Medical_ArePriorityHigh()
    {
        var targets = new[]
        {
            MakeTarget(SupplyCategory.Water, 3m),
            MakeTarget(SupplyCategory.Food, 0.5m),
            MakeTarget(SupplyCategory.Medical, 1m, 1),
        };

        var result = ReadinessScoreService.Calculate([], targets, memberCount: 1, Today);

        Assert.All(result.ShoppingList, i => Assert.Equal(ShoppingPriority.High, i.Priority));
    }

    // --- Estimated cost ---

    [Fact]
    public void EstimatedCost_CalculatedFromAveragePricePerUnit()
    {
        // Required: 3 × 1 × 1 = 3. Have 0. Gap = 3.
        // Two items with prices 2.00 and 4.00 → avg 3.00 → cost = 3 × 3 = 9
        var target = MakeTarget(SupplyCategory.Water, 3m, 1);
        var item1 = MakeItem(SupplyCategory.Water, 0m, price: 2.00m);
        var item2 = MakeItem(SupplyCategory.Water, 0m, price: 4.00m);

        var result = ReadinessScoreService.Calculate([item1, item2], [target], memberCount: 1, Today);

        Assert.Equal(9m, result.ShoppingList[0].EstimatedCost);
    }

    [Fact]
    public void EstimatedCost_IsNull_WhenNoItemsHavePrice()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 1);

        var result = ReadinessScoreService.Calculate([], [target], memberCount: 1, Today);

        Assert.Null(result.ShoppingList[0].EstimatedCost);
    }

    // --- Weighted overall score ---

    [Fact]
    public void OverallScore_IsWeightedAverage_WaterFoodWeighMore()
    {
        // Water (weight 3) at 100%, Tools (weight 0.5) at 0%.
        // Weighted = (100×3 + 0×0.5) / (3+0.5) = 300/3.5 ≈ 86
        var targets = new[]
        {
            MakeTarget(SupplyCategory.Water, 3m, 14),
            MakeTarget(SupplyCategory.Tools, 1m, 1),
        };
        var waterItem = MakeItem(SupplyCategory.Water, 168m); // 3 × 14 × 4 = fully stocked

        var result = ReadinessScoreService.Calculate([waterItem], targets, memberCount: 4, Today);

        Assert.Equal(86, result.OverallScore);
        Assert.Equal(100, result.CategoryScores.First(c => c.Category == SupplyCategory.Water).Score);
        Assert.Equal(0, result.CategoryScores.First(c => c.Category == SupplyCategory.Tools).Score);
    }

    // --- RequiredTotal ---

    [Fact]
    public void RequiredTotal_IsCalculatedCorrectly()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        Assert.Equal(168m, target.RequiredTotal(4));  // 3 × 14 × 4
        Assert.Equal(42m, target.RequiredTotal(1));   // 3 × 14 × 1
    }
}
