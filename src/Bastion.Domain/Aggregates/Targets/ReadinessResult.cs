using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Domain.Aggregates.Targets;

public record ReadinessResult(
    int OverallScore,
    IReadOnlyList<CategoryScore> CategoryScores,
    IReadOnlyList<ShoppingListItem> ShoppingList,
    int EquipmentScore);

public record CategoryScore(
    SupplyCategory Category,
    int Score,
    decimal Available,
    decimal Required,
    string Unit);

public record ShoppingListItem(
    SupplyCategory Category,
    decimal Gap,
    string Unit,
    ShoppingPriority Priority,
    decimal? EstimatedCost);
