using Bastion.Domain.Aggregates.Supplies;
using Bastion.Domain.Aggregates.Targets;

namespace Bastion.Application.Dashboard;

public record DashboardDto(
    int OverallScore,
    int MemberCount,
    IReadOnlyList<CategoryScoreDto> CategoryScores,
    IReadOnlyList<ShoppingListItemDto> ShoppingList,
    int EquipmentScore,
    IReadOnlyList<OverdueTaskDto> OverdueTasks);

public record CategoryScoreDto(
    SupplyCategory Category,
    int Score,
    decimal Available,
    decimal Required,
    string Unit);

public record ShoppingListItemDto(
    SupplyCategory Category,
    decimal Gap,
    string Unit,
    ShoppingPriority Priority,
    decimal? EstimatedCost);

public record OverdueTaskDto(
    Guid EquipmentId,
    string EquipmentName,
    Guid TaskId,
    string TaskDescription,
    DateOnly NextDueAt,
    int DaysOverdue);
