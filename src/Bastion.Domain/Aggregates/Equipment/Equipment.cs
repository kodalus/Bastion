using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Equipment;

public class Equipment : Entity
{
    public string Name { get; private set; } = string.Empty;
    public EquipmentCategory Category { get; private set; }
    public DateOnly PurchaseDate { get; private set; }
    public Guid HouseholdId { get; private set; }

    private readonly List<MaintenanceTask> _tasks = [];
    public IReadOnlyList<MaintenanceTask> Tasks => _tasks.AsReadOnly();

    private Equipment() { }

    public static Equipment Create(
        string name,
        EquipmentCategory category,
        DateOnly purchaseDate,
        Guid householdId) =>
        new()
        {
            Name = name,
            Category = category,
            PurchaseDate = purchaseDate,
            HouseholdId = householdId
        };

    public void Update(string name, EquipmentCategory category, DateOnly purchaseDate)
    {
        Name = name;
        Category = category;
        PurchaseDate = purchaseDate;
        MarkUpdated();
    }

    public MaintenanceTask AddTask(string description, int intervalDays)
    {
        var task = MaintenanceTask.Create(description, intervalDays, Id, PurchaseDate);
        _tasks.Add(task);
        return task;
    }

    public bool RemoveTask(Guid taskId)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == taskId);
        if (task is null) return false;
        _tasks.Remove(task);
        return true;
    }
}
