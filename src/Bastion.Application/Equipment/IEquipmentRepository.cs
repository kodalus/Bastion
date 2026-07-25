using Bastion.Domain.Aggregates.Equipment;

namespace Bastion.Application.Equipment;

public interface IEquipmentRepository
{
    Task<IReadOnlyList<Domain.Aggregates.Equipment.Equipment>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default);
    Task<Domain.Aggregates.Equipment.Equipment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<MaintenanceTask>> GetAllTasksByHouseholdAsync(Guid householdId, CancellationToken ct = default);
    Task AddAsync(Domain.Aggregates.Equipment.Equipment equipment, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    void Remove(Domain.Aggregates.Equipment.Equipment equipment);
}
