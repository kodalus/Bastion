using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Equipment;

public class MaintenanceTask : Entity
{
    public string Description { get; private set; } = string.Empty;
    public int IntervalDays { get; private set; }
    public DateOnly? LastCompletedAt { get; private set; }
    public Guid EquipmentId { get; private set; }

    // First due = PurchaseDate + IntervalDays, stored so entity is self-contained
    public DateOnly BaseDueDate { get; private set; }

    private MaintenanceTask() { }

    internal static MaintenanceTask Create(
        string description,
        int intervalDays,
        Guid equipmentId,
        DateOnly purchaseDate) =>
        new()
        {
            Description = description,
            IntervalDays = intervalDays,
            EquipmentId = equipmentId,
            BaseDueDate = purchaseDate.AddDays(intervalDays)
        };

    public void Update(string description, int intervalDays)
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

    public DateOnly NextDueAt => LastCompletedAt?.AddDays(IntervalDays) ?? BaseDueDate;

    public bool IsOverdue(DateOnly today) => NextDueAt < today;

    public bool IsDueSoon(DateOnly today, int withinDays = 14) =>
        !IsOverdue(today) && NextDueAt <= today.AddDays(withinDays);
}
