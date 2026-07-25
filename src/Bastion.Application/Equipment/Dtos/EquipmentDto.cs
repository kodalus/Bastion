using Bastion.Domain.Aggregates.Equipment;

namespace Bastion.Application.Equipment.Dtos;

public record MaintenanceTaskDto(
    Guid Id,
    Guid EquipmentId,
    string Description,
    int? IntervalDays,
    DateOnly? LastCompletedAt,
    DateOnly? NextDueAt,
    bool IsOverdue,
    bool IsDueSoon);

public record EquipmentDto(
    Guid Id,
    Guid HouseholdId,
    string Name,
    EquipmentCategory Category,
    DateOnly PurchaseDate,
    IReadOnlyList<MaintenanceTaskDto> Tasks);

public record CreateEquipmentRequest(
    string Name,
    EquipmentCategory Category,
    DateOnly PurchaseDate);

public record UpdateEquipmentRequest(
    string Name,
    EquipmentCategory Category,
    DateOnly PurchaseDate);

public record CreateMaintenanceTaskRequest(
    string Description,
    int? IntervalDays);

public record UpdateMaintenanceTaskRequest(
    string Description,
    int? IntervalDays);
