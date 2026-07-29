using Bastion.Domain.Aggregates.Equipment;
using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Domain.Aggregates.Targets;

public static class ReadinessScoreService
{
    private const int ExpiringSoonDays = 30;
    private const decimal ExpiringSoonWeight = 0.5m;
    private const decimal EquipmentWeight = 2m;
    // 72 h / (14-day horizon × 24 h) ≈ 21 % — civil-defence 72-hour minimum
    private const int CriticalDeficitThreshold = 21;

    // Overload without maintenance tasks — existing callers and tests unchanged
    public static ReadinessResult Calculate(
        IReadOnlyList<SupplyItem> supplies,
        IReadOnlyList<TargetLevel> targets,
        int memberCount,
        DateOnly today) =>
        Calculate(supplies, targets, [], memberCount, today);

    public static ReadinessResult Calculate(
        IReadOnlyList<SupplyItem> supplies,
        IReadOnlyList<TargetLevel> targets,
        IReadOnlyList<MaintenanceTask> maintenanceTasks,
        int memberCount,
        DateOnly today)
    {
        if (targets.Count == 0 && maintenanceTasks.Count == 0)
            return new ReadinessResult(0, [], [], 100, false);

        var categoryScores = new List<CategoryScore>();
        var shoppingList = new List<ShoppingListItem>();

        foreach (var target in targets)
        {
            var required = target.RequiredTotal(memberCount);
            var categoryItems = supplies.Where(s => s.Category == target.Category).ToList();

            decimal available;
            if (target.IsConsumable)
            {
                available = categoryItems.Sum(item =>
                {
                    if (item.IsExpired(today)) return 0m;
                    if (item.IsExpiringSoon(today, ExpiringSoonDays)) return item.Quantity * ExpiringSoonWeight;
                    return item.Quantity;
                });
            }
            else
            {
                // Non-consumable: count only non-expired items (expiry weighting not meaningful)
                available = categoryItems
                    .Where(item => !item.IsExpired(today))
                    .Sum(item => item.Quantity);
            }

            var score = required == 0 ? 100
                : target.IsConsumable
                    ? (int)Math.Min(100m, Math.Round(available / required * 100, MidpointRounding.AwayFromZero))
                    : available >= required ? 100 : 0;

            categoryScores.Add(new CategoryScore(target.Category, score, available, required, target.Unit));

            if (score < 100)
            {
                var gap = required - available;
                var prices = categoryItems
                    .Where(i => i.EstimatedPricePerUnit.HasValue)
                    .Select(i => i.EstimatedPricePerUnit!.Value)
                    .ToList();
                decimal? estimatedCost = prices.Count > 0 ? gap * prices.Average() : null;

                shoppingList.Add(new ShoppingListItem(
                    target.Category, gap, target.Unit, GetPriority(target.Category), estimatedCost));
            }
        }

        // Equipment score: % of tasks not overdue
        var equipmentScore = maintenanceTasks.Count == 0
            ? 100
            : (int)Math.Round(
                maintenanceTasks.Count(t => !t.IsOverdue(today)) * 100.0 / maintenanceTasks.Count,
                MidpointRounding.AwayFromZero);

        // Overall: weighted average of supply categories + equipment (only if tasks exist)
        var weightByCategory = targets.ToDictionary(t => t.Category, t => t.Weight);
        var totalWeight = categoryScores.Sum(c => weightByCategory.GetValueOrDefault(c.Category, 1m));
        var weightedSum = categoryScores.Sum(c => c.Score * weightByCategory.GetValueOrDefault(c.Category, 1m));

        if (maintenanceTasks.Count > 0)
        {
            totalWeight += EquipmentWeight;
            weightedSum += equipmentScore * EquipmentWeight;
        }

        var overallScore = totalWeight == 0
            ? equipmentScore
            : (int)Math.Round(weightedSum / totalWeight, MidpointRounding.AwayFromZero);

        var worstCriticalScore = categoryScores
            .Where(cs => GetPriority(cs.Category) == ShoppingPriority.High)
            .Select(cs => cs.Score)
            .DefaultIfEmpty(100)
            .Min();

        var hasCriticalDeficit = worstCriticalScore < CriticalDeficitThreshold;

        // Overall readiness cannot exceed the weakest critical link
        if (hasCriticalDeficit)
            overallScore = Math.Min(overallScore, worstCriticalScore);

        var sortedShoppingList = shoppingList
            .OrderBy(i => (int)i.Priority)
            .ThenBy(i => i.Category.ToString())
            .ToList();

        return new ReadinessResult(
            overallScore,
            categoryScores.AsReadOnly(),
            sortedShoppingList.AsReadOnly(),
            equipmentScore,
            hasCriticalDeficit);
    }

    private static ShoppingPriority GetPriority(SupplyCategory category) => category switch
    {
        SupplyCategory.Water or SupplyCategory.Food or SupplyCategory.Medical => ShoppingPriority.High,
        SupplyCategory.Hygiene or SupplyCategory.Energy => ShoppingPriority.Medium,
        _ => ShoppingPriority.Low
    };
}
