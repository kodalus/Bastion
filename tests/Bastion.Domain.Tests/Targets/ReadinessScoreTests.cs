using Bastion.Domain.Aggregates.Equipment;
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

    // --- Non-consumable binary scoring ---

    [Fact]
    public void NonConsumable_FullStock_Score100()
    {
        // Tools target: qppd=1, required=1 (absolute). Have 4 items → score 100
        var target = MakeTarget(SupplyCategory.Tools, 1m, 1);
        var items = new[]
        {
            MakeItem(SupplyCategory.Tools, 1m),
            MakeItem(SupplyCategory.Tools, 3m),
        };

        var result = ReadinessScoreService.Calculate([..items], [target], memberCount: 4, Today);

        Assert.Equal(100, result.CategoryScores[0].Score);
        Assert.Empty(result.ShoppingList);
    }

    [Fact]
    public void NonConsumable_NoItems_Score0()
    {
        var target = MakeTarget(SupplyCategory.Documents, 1m, 1);

        var result = ReadinessScoreService.Calculate([], [target], memberCount: 4, Today);

        Assert.Equal(0, result.CategoryScores[0].Score);
        Assert.Single(result.ShoppingList);
    }

    [Fact]
    public void NonConsumable_ScalesByQppd_NotByMembers()
    {
        // qppd=2 → required=2 absolute (not 2×4=8). Have 2 → score 100.
        var target = MakeTarget(SupplyCategory.Tools, 2m, 1);
        var item = MakeItem(SupplyCategory.Tools, 2m);

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 4, Today);

        Assert.Equal(100, result.CategoryScores[0].Score);
        Assert.Equal(2m, target.RequiredTotal(4)); // RequiredTotal returns qppd for non-consumable
    }

    [Fact]
    public void NonConsumable_ExpiringItems_NotHalved()
    {
        // Non-consumable: expiry weighting not applied. Item expiring in 5 days counts at full qty.
        var target = MakeTarget(SupplyCategory.Documents, 1m, 1);
        var expiringItem = MakeItem(SupplyCategory.Documents, 1m, expiry: Today.AddDays(5));

        var result = ReadinessScoreService.Calculate([expiringItem], [target], memberCount: 1, Today);

        Assert.Equal(100, result.CategoryScores[0].Score);
        Assert.Equal(1m, result.CategoryScores[0].Available);
    }

    // --- Critical deficit flag ---

    [Fact]
    public void CriticalDeficit_False_WhenAllHighCategoriesAboveThreshold()
    {
        // Medical required: 1 × 14 × 4 = 56. Have 22% of 56 = 12.32 → score 22% > threshold 21%
        var target = MakeTarget(SupplyCategory.Medical, 1m, 14);
        var item = MakeItem(SupplyCategory.Medical, 56m * 0.22m); // 12.32

        var result = ReadinessScoreService.Calculate([item], [target], memberCount: 4, Today);

        Assert.False(result.HasCriticalDeficit);
    }

    [Fact]
    public void CriticalDeficit_True_WhenHighCategoryBelowThreshold()
    {
        // Medical at 0%, all else at 100% → score ≈ 82%, but flag must trigger
        var targets = new[]
        {
            MakeTarget(SupplyCategory.Water, 3m, 14),
            MakeTarget(SupplyCategory.Food, 0.5m, 14),
            MakeTarget(SupplyCategory.Medical, 1m, 14),
        };
        var waterItem = MakeItem(SupplyCategory.Water, 168m);  // 100%
        var foodItem = MakeItem(SupplyCategory.Food, 28m);     // 100%
        // No Medical items → Medical = 0%

        var result = ReadinessScoreService.Calculate(
            [waterItem, foodItem], targets, memberCount: 4, Today);

        Assert.True(result.HasCriticalDeficit);
        Assert.True(result.OverallScore > 60); // overall still high despite flag
    }

    [Fact]
    public void CriticalDeficit_False_WhenOnlyLowCategoryIsDeficient()
    {
        // Tools at 0% (Low priority) → no critical deficit
        var target = MakeTarget(SupplyCategory.Tools, 1m, 1);

        var result = ReadinessScoreService.Calculate([], [target], memberCount: 1, Today);

        Assert.False(result.HasCriticalDeficit);
    }

    [Fact]
    public void CriticalDeficit_False_WhenNoTargets()
    {
        var result = ReadinessScoreService.Calculate([], [], memberCount: 1, Today);

        Assert.False(result.HasCriticalDeficit);
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

    // --- Equipment score ---

    private static IReadOnlyList<MaintenanceTask> MakeTasks(int overdueCount, int currentCount)
    {
        // Overdue: purchased 2 years ago, 90-day interval → BaseDueDate in the past
        var oldPurchase = new DateOnly(2024, 1, 1);
        var eq = Equipment.Create("Test", EquipmentCategory.Other, oldPurchase, Guid.NewGuid());

        for (var i = 0; i < overdueCount; i++)
            eq.AddTask($"Overdue task {i}", 90);

        // Current: completed recently, next due in the future
        for (var i = 0; i < currentCount; i++)
        {
            var task = eq.AddTask($"Current task {i}", 365);
            task.Complete(new DateOnly(2026, 7, 20)); // NextDueAt = 2027-07-20
        }

        return eq.Tasks;
    }

    [Fact]
    public void NoTasks_EquipmentScore100_NotCountedInOverall()
    {
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var item = MakeItem(SupplyCategory.Water, 84m); // 50% stocked

        var result = ReadinessScoreService.Calculate([item], [target], [], memberCount: 4, Today);

        Assert.Equal(100, result.EquipmentScore);
        // Overall should equal supply-only weighted score (50%), not affected by equipment
        Assert.Equal(50, result.OverallScore);
    }

    [Fact]
    public void AllTasksCurrent_EquipmentScore100()
    {
        var tasks = MakeTasks(overdueCount: 0, currentCount: 3);

        var result = ReadinessScoreService.Calculate([], [], tasks, memberCount: 4, Today);

        Assert.Equal(100, result.EquipmentScore);
    }

    [Fact]
    public void AllTasksOverdue_EquipmentScore0()
    {
        var tasks = MakeTasks(overdueCount: 4, currentCount: 0);

        var result = ReadinessScoreService.Calculate([], [], tasks, memberCount: 4, Today);

        Assert.Equal(0, result.EquipmentScore);
    }

    [Fact]
    public void HalfTasksOverdue_EquipmentScore50()
    {
        var tasks = MakeTasks(overdueCount: 2, currentCount: 2);

        var result = ReadinessScoreService.Calculate([], [], tasks, memberCount: 4, Today);

        Assert.Equal(50, result.EquipmentScore);
    }

    [Fact]
    public void EquipmentAffectsOverallScore_WhenTasksExist()
    {
        // Water (w=3) at 100%. Equipment (w=2) at 0% (all overdue).
        // Overall = (100×3 + 0×2) / (3+2) = 300/5 = 60
        var target = MakeTarget(SupplyCategory.Water, 3m, 14);
        var item = MakeItem(SupplyCategory.Water, 168m); // fully stocked
        var tasks = MakeTasks(overdueCount: 2, currentCount: 0);

        var result = ReadinessScoreService.Calculate([item], [target], tasks, memberCount: 4, Today);

        Assert.Equal(0, result.EquipmentScore);
        Assert.Equal(60, result.OverallScore);
    }
}
