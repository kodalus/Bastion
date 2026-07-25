using Bastion.Application.Targets;
using Bastion.Domain.Aggregates.Targets;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class TargetLevelRepository(AppDbContext db) : ITargetLevelRepository
{
    public async Task<IReadOnlyList<TargetLevel>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default) =>
        await db.TargetLevels
            .Where(t => t.HouseholdId == householdId)
            .OrderBy(t => t.Category)
            .ToListAsync(ct);

    public async Task<TargetLevel?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.TargetLevels.FindAsync([id], ct);

    public async Task AddAsync(TargetLevel target, CancellationToken ct = default)
    {
        db.TargetLevels.Add(target);
        await db.SaveChangesAsync(ct);
    }

    public Task SaveAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);

    public void Remove(TargetLevel target) =>
        db.TargetLevels.Remove(target);
}
