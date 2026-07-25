using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Domain.Aggregates.Targets;

public static class ReadinessScoreService
{
    private const int ExpiringSoonDays = 30;
    private const decimal ExpiringSoonWeight = 0.5m;

    private static readonly Dictionary<SupplyCategory, decimal> Weights = new()
    {
        [SupplyCategory.Water] = 3m,
        [SupplyCategory.Food] = 3m,
        [SupplyCategory.Medical] = 2m,
        [SupplyCategory.Hygiene] = 1m,
        [SupplyCategory.Energy] = 1m,
        [SupplyCategory.Tools] = 0.5m,
        [SupplyCategory.Documents] = 0.5m,
    };

    public static ReadinessResult Calculate(
        IReadOnlyList<SupplyItem> supplies,
        IReadOnlyList<TargetLevel> targets,
        int memberCount,
        DateOnly today)
    {
        if (targets.Count == 0)
            return new ReadinessResult(0, [], []);

        var categoryScores = new List<CategoryScore>();
        var shoppingList = new List<ShoppingListItem>();

        foreach (var target in targets)
        {
            var required = target.RequiredTotal(memberCount);
            var categoryItems = supplies.Where(s => s.Category == target.Category).ToList();

            var available = categoryItems.Sum(item =>
            {
                if (item.IsExpired(today)) return 0m;
                if (item.IsExpiringSoon(today, ExpiringSoonDays)) return item.Quantity * ExpiringSoonWeight;
                return item.Quantity;
            });

            var score = required == 0
                ? 100
                : (int)Math.Min(100m, Math.Round(available / required * 100, MidpointRounding.AwayFromZero));

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
                    target.Category,
                    gap,
                    target.Unit,
                    GetPriority(target.Category),
                    estimatedCost));
            }
        }

        var totalWeight = categoryScores.Sum(c => Weights.GetValueOrDefault(c.Category, 1m));
        var weightedSum = categoryScores.Sum(c => c.Score * Weights.GetValueOrDefault(c.Category, 1m));
        var overallScore = totalWeight == 0
            ? 0
            : (int)Math.Round(weightedSum / totalWeight, MidpointRounding.AwayFromZero);

        var sortedShoppingList = shoppingList
            .OrderBy(i => (int)i.Priority)
            .ThenBy(i => i.Category.ToString())
            .ToList();

        return new ReadinessResult(overallScore, categoryScores.AsReadOnly(), sortedShoppingList.AsReadOnly());
    }

    private static ShoppingPriority GetPriority(SupplyCategory category) => category switch
    {
        SupplyCategory.Water or SupplyCategory.Food or SupplyCategory.Medical => ShoppingPriority.High,
        SupplyCategory.Hygiene or SupplyCategory.Energy => ShoppingPriority.Medium,
        _ => ShoppingPriority.Low
    };
}
