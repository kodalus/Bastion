using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Scenarios;

public class ChecklistItem : Entity
{
    public Guid ScenarioId { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }
    public bool IsCompleted { get; private set; }

    private ChecklistItem() { }

    internal static ChecklistItem Create(Guid scenarioId, string text, int sortOrder) =>
        new()
        {
            ScenarioId = scenarioId,
            Text = text,
            SortOrder = sortOrder,
            IsCompleted = false
        };

    public void Toggle()
    {
        IsCompleted = !IsCompleted;
        MarkUpdated();
    }

    public void Reset()
    {
        IsCompleted = false;
        MarkUpdated();
    }
}
