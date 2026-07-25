using Bastion.Domain.Aggregates.Targets;

namespace Bastion.Application.Targets;

public interface ITargetLevelRepository
{
    Task<IReadOnlyList<TargetLevel>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default);
    Task<TargetLevel?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(TargetLevel target, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    void Remove(TargetLevel target);
}
