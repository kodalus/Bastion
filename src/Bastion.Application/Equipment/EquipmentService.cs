using Bastion.Application.Equipment.Dtos;
using Bastion.Application.Dashboard;
using Bastion.Domain.Aggregates.Equipment;

namespace Bastion.Application.Equipment;

public interface IEquipmentService
{
    Task<IReadOnlyList<EquipmentDto>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default);
    Task<EquipmentDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<EquipmentDto> CreateAsync(Guid householdId, CreateEquipmentRequest request, CancellationToken ct = default);
    Task<EquipmentDto?> UpdateAsync(Guid id, UpdateEquipmentRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<MaintenanceTaskDto?> AddTaskAsync(Guid equipmentId, CreateMaintenanceTaskRequest request, CancellationToken ct = default);
    Task<MaintenanceTaskDto?> UpdateTaskAsync(Guid equipmentId, Guid taskId, UpdateMaintenanceTaskRequest request, CancellationToken ct = default);
    Task<MaintenanceTaskDto?> CompleteTaskAsync(Guid equipmentId, Guid taskId, DateOnly completedAt, CancellationToken ct = default);
    Task<bool> DeleteTaskAsync(Guid equipmentId, Guid taskId, CancellationToken ct = default);
}

public class EquipmentService(IEquipmentRepository repository) : IEquipmentService
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    public async Task<IReadOnlyList<EquipmentDto>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default)
    {
        var list = await repository.GetByHouseholdAsync(householdId, ct);
        return list.Select(ToDto).ToList();
    }

    public async Task<EquipmentDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(id, ct);
        return eq is null ? null : ToDto(eq);
    }

    public async Task<EquipmentDto> CreateAsync(Guid householdId, CreateEquipmentRequest request, CancellationToken ct = default)
    {
        var eq = Domain.Aggregates.Equipment.Equipment.Create(
            request.Name, request.Category, request.PurchaseDate, householdId);
        await repository.AddAsync(eq, ct);
        return ToDto(eq);
    }

    public async Task<EquipmentDto?> UpdateAsync(Guid id, UpdateEquipmentRequest request, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(id, ct);
        if (eq is null) return null;
        eq.Update(request.Name, request.Category, request.PurchaseDate);
        await repository.SaveAsync(ct);
        return ToDto(eq);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(id, ct);
        if (eq is null) return false;
        repository.Remove(eq);
        await repository.SaveAsync(ct);
        return true;
    }

    public async Task<MaintenanceTaskDto?> AddTaskAsync(Guid equipmentId, CreateMaintenanceTaskRequest request, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(equipmentId, ct);
        if (eq is null) return null;
        var task = eq.AddTask(request.Description, request.IntervalDays);
        repository.AddTask(task);
        await repository.SaveAsync(ct);
        return ToTaskDto(task);
    }

    public async Task<MaintenanceTaskDto?> UpdateTaskAsync(Guid equipmentId, Guid taskId, UpdateMaintenanceTaskRequest request, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(equipmentId, ct);
        var task = eq?.Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task is null) return null;
        task.Update(request.Description, request.IntervalDays);
        await repository.SaveAsync(ct);
        return ToTaskDto(task);
    }

    public async Task<MaintenanceTaskDto?> CompleteTaskAsync(Guid equipmentId, Guid taskId, DateOnly completedAt, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(equipmentId, ct);
        var task = eq?.Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task is null) return null;
        task.Complete(completedAt);
        await repository.SaveAsync(ct);
        return ToTaskDto(task);
    }

    public async Task<bool> DeleteTaskAsync(Guid equipmentId, Guid taskId, CancellationToken ct = default)
    {
        var eq = await repository.GetByIdAsync(equipmentId, ct);
        if (eq is null) return false;
        var removed = eq.RemoveTask(taskId);
        if (!removed) return false;
        await repository.SaveAsync(ct);
        return true;
    }

    private MaintenanceTaskDto ToTaskDto(MaintenanceTask t) =>
        new(t.Id, t.EquipmentId, t.Description, t.IntervalDays,
            t.LastCompletedAt, t.NextDueAt,
            t.IsOverdue(Today), t.IsDueSoon(Today));

    private EquipmentDto ToDto(Domain.Aggregates.Equipment.Equipment e) =>
        new(e.Id, e.HouseholdId, e.Name, e.Category, e.PurchaseDate,
            e.Tasks.Select(ToTaskDto).ToList());
}
