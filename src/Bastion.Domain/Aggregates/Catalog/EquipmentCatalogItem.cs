using Bastion.Domain.Aggregates.Equipment;

namespace Bastion.Domain.Aggregates.Catalog;

public class EquipmentCatalogItem
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = "";
    public EquipmentCategory Category { get; private set; }
    public string Hint { get; private set; } = "";
    public decimal? Price { get; private set; }

    private EquipmentCatalogItem() { }

    public static EquipmentCatalogItem Create(string name, EquipmentCategory category, string hint)
        => new() { Id = Guid.NewGuid(), Name = name, Category = category, Hint = hint };

    public void SetPrice(decimal? price) => Price = price;
}
