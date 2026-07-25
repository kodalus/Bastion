using Bastion.Application.Supplies;
using Bastion.Application.Targets;
using Bastion.Domain.Aggregates.Households;
using Bastion.Domain.Aggregates.Targets;

namespace Bastion.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardDto?> GetReadinessAsync(CancellationToken ct = default);
}

public interface IHouseholdRepository
{
    Task<Household?> GetFirstAsync(CancellationToken ct = default);
}

public class DashboardService(
    IHouseholdRepository householdRepository,
    ITargetLevelRepository targetRepository,
    ISupplyRepository supplyRepository) : IDashboardService
{
    public async Task<DashboardDto?> GetReadinessAsync(CancellationToken ct = default)
    {
        var household = await householdRepository.GetFirstAsync(ct);
        if (household is null) return null;

        var targets = await targetRepository.GetByHouseholdAsync(household.Id, ct);
        var supplyItems = await supplyRepository.GetAllAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = ReadinessScoreService.Calculate(supplyItems, targets, household.MemberCount, today);

        return new DashboardDto(
            result.OverallScore,
            household.MemberCount,
            result.CategoryScores
                .Select(c => new CategoryScoreDto(c.Category, c.Score, c.Available, c.Required, c.Unit))
                .ToList(),
            result.ShoppingList
                .Select(s => new ShoppingListItemDto(s.Category, s.Gap, s.Unit, s.Priority, s.EstimatedCost))
                .ToList());
    }
}
