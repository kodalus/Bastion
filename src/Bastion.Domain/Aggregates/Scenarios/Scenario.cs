using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Scenarios;

public class Scenario : Entity
{
    public Guid HouseholdId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;

    private readonly List<ChecklistItem> _items = [];
    public IReadOnlyList<ChecklistItem> Items => _items.AsReadOnly();

    private Scenario() { }

    public static Scenario Create(Guid householdId, string name, string description) =>
        new()
        {
            HouseholdId = householdId,
            Name = name,
            Description = description
        };

    public ChecklistItem AddItem(string text, int sortOrder)
    {
        var item = ChecklistItem.Create(Id, text, sortOrder);
        _items.Add(item);
        MarkUpdated();
        return item;
    }

    public bool RemoveItem(Guid itemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return false;
        _items.Remove(item);
        MarkUpdated();
        return true;
    }

    public void ResetAll()
    {
        foreach (var item in _items)
            item.Reset();
        MarkUpdated();
    }
}
