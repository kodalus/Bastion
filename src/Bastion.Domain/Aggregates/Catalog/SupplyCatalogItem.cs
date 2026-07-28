using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Domain.Aggregates.Catalog;

public class SupplyCatalogItem
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = "";
    public SupplyCategory Category { get; private set; }
    public string Unit { get; private set; } = "";
    public decimal SuggestedQty { get; private set; }
    public decimal? Price { get; private set; }

    private SupplyCatalogItem() { }

    public static SupplyCatalogItem Create(string name, SupplyCategory category, string unit, decimal suggestedQty)
        => new() { Id = Guid.NewGuid(), Name = name, Category = category, Unit = unit, SuggestedQty = suggestedQty };

    public void SetPrice(decimal? price) => Price = price;
}
