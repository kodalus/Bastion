using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Locations;

public class StorageLocation : Entity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    private StorageLocation() { }

    public static StorageLocation Create(string name, string? description = null) =>
        new() { Name = name, Description = description };

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
        MarkUpdated();
    }
}
