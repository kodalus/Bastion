using Bastion.Application.Equipment;
using Bastion.Domain.Aggregates.Equipment;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class EquipmentRepository(AppDbContext db) : IEquipmentRepository
{
    public async Task<IReadOnlyList<Domain.Aggregates.Equipment.Equipment>> GetByHouseholdAsync(
        Guid householdId, CancellationToken ct = default) =>
        await db.Equipment
            .Include(e => e.Tasks)
            .Where(e => e.HouseholdId == householdId)
            .OrderBy(e => e.Name)
            .ToListAsync(ct);

    public async Task<Domain.Aggregates.Equipment.Equipment?> GetByIdAsync(
        Guid id, CancellationToken ct = default) =>
        await db.Equipment
            .Include(e => e.Tasks)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<IReadOnlyList<MaintenanceTask>> GetAllTasksByHouseholdAsync(
        Guid householdId, CancellationToken ct = default) =>
        await db.MaintenanceTasks
            .Where(t => db.Equipment.Any(e => e.Id == t.EquipmentId && e.HouseholdId == householdId))
            .ToListAsync(ct);

    public async Task AddAsync(Domain.Aggregates.Equipment.Equipment equipment, CancellationToken ct = default)
    {
        db.Equipment.Add(equipment);
        await db.SaveChangesAsync(ct);
    }

    public Task SaveAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);

    public void Remove(Domain.Aggregates.Equipment.Equipment equipment) =>
        db.Equipment.Remove(equipment);
}
