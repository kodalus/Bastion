using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Equipment;

public class MaintenanceTask : Entity
{
    public string Description { get; private set; } = string.Empty;
    public int? IntervalDays { get; private set; }
    public DateOnly? LastCompletedAt { get; private set; }
    public Guid EquipmentId { get; private set; }
    public DateOnly BaseDueDate { get; private set; }

    private MaintenanceTask() { }

    internal static MaintenanceTask Create(
        string description,
        int? intervalDays,
        Guid equipmentId,
        DateOnly purchaseDate) =>
        new()
        {
            Description = description,
            IntervalDays = intervalDays,
            EquipmentId = equipmentId,
            BaseDueDate = intervalDays.HasValue ? purchaseDate.AddDays(intervalDays.Value) : purchaseDate
        };

    public void Update(string description, int? intervalDays)
    {
        Description = description;
        IntervalDays = intervalDays;
        MarkUpdated();
    }

    public void Complete(DateOnly completedAt)
    {
        LastCompletedAt = completedAt;
        MarkUpdated();
    }

    // null for one-time tasks (no interval) — UI shows "—" or "Jednorazowe"
    public DateOnly? NextDueAt =>
        IntervalDays.HasValue
            ? LastCompletedAt?.AddDays(IntervalDays.Value) ?? BaseDueDate
            : null;

    public bool IsOverdue(DateOnly today) =>
        IntervalDays.HasValue && NextDueAt.HasValue && NextDueAt.Value < today;

    public bool IsDueSoon(DateOnly today, int withinDays = 14) =>
        IntervalDays.HasValue
        && NextDueAt.HasValue
        && !IsOverdue(today)
        && NextDueAt.Value <= today.AddDays(withinDays);
}
