using Bastion.Application.Scenarios;
using Bastion.Domain.Aggregates.Scenarios;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class ScenarioRepository(AppDbContext db) : IScenarioRepository
{
    public async Task<IReadOnlyList<Scenario>> GetAllAsync(Guid householdId, CancellationToken ct = default) =>
        await db.Scenarios
            .Where(s => s.HouseholdId == householdId)
            .Include(s => s.Items)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

    public async Task<Scenario?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Scenarios
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddAsync(Scenario scenario, CancellationToken ct = default) =>
        await db.Scenarios.AddAsync(scenario, ct);

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var scenario = await db.Scenarios.FindAsync([id], ct);
        if (scenario is not null)
            db.Scenarios.Remove(scenario);
    }

    public async Task SaveAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
