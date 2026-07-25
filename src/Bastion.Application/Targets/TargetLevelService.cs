using Bastion.Application.Targets.Dtos;
using Bastion.Domain.Aggregates.Targets;

namespace Bastion.Application.Targets;

public interface ITargetLevelService
{
    Task<IReadOnlyList<TargetLevelDto>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default);
    Task<TargetLevelDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TargetLevelDto> CreateAsync(CreateTargetLevelRequest request, CancellationToken ct = default);
    Task<TargetLevelDto?> UpdateAsync(Guid id, UpdateTargetLevelRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}

public class TargetLevelService(ITargetLevelRepository repository) : ITargetLevelService
{
    public async Task<IReadOnlyList<TargetLevelDto>> GetByHouseholdAsync(Guid householdId, CancellationToken ct = default)
    {
        var targets = await repository.GetByHouseholdAsync(householdId, ct);
        return targets.Select(ToDto).ToList();
    }

    public async Task<TargetLevelDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var target = await repository.GetByIdAsync(id, ct);
        return target is null ? null : ToDto(target);
    }

    public async Task<TargetLevelDto> CreateAsync(CreateTargetLevelRequest request, CancellationToken ct = default)
    {
        var target = TargetLevel.Create(
            request.HouseholdId,
            request.Category,
            request.QuantityPerPersonPerDay,
            request.HorizonDays,
            request.Unit);
        await repository.AddAsync(target, ct);
        await repository.SaveAsync(ct);
        return ToDto(target);
    }

    public async Task<TargetLevelDto?> UpdateAsync(Guid id, UpdateTargetLevelRequest request, CancellationToken ct = default)
    {
        var target = await repository.GetByIdAsync(id, ct);
        if (target is null) return null;
        target.Update(request.QuantityPerPersonPerDay, request.HorizonDays, request.Unit);
        await repository.SaveAsync(ct);
        return ToDto(target);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var target = await repository.GetByIdAsync(id, ct);
        if (target is null) return false;
        repository.Remove(target);
        await repository.SaveAsync(ct);
        return true;
    }

    private static TargetLevelDto ToDto(TargetLevel t) =>
        new(t.Id, t.HouseholdId, t.Category, t.QuantityPerPersonPerDay, t.HorizonDays, t.Unit, 0);
}
