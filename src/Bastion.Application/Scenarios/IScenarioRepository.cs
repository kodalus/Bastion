using Bastion.Domain.Aggregates.Scenarios;

namespace Bastion.Application.Scenarios;

public interface IScenarioRepository
{
    Task<IReadOnlyList<Scenario>> GetAllAsync(Guid householdId, CancellationToken ct = default);
    Task<Scenario?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Scenario scenario, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
