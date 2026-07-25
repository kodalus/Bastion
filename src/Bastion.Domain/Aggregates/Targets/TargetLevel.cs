using Bastion.Domain.Aggregates.Supplies;
using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Targets;

public class TargetLevel : Entity
{
    public Guid HouseholdId { get; private set; }
    public SupplyCategory Category { get; private set; }
    public decimal QuantityPerPersonPerDay { get; private set; }
    public int HorizonDays { get; private set; }
    public string Unit { get; private set; } = string.Empty;

    private TargetLevel() { }

    public static TargetLevel Create(
        Guid householdId,
        SupplyCategory category,
        decimal quantityPerPersonPerDay,
        int horizonDays,
        string unit) =>
        new()
        {
            HouseholdId = householdId,
            Category = category,
            QuantityPerPersonPerDay = quantityPerPersonPerDay,
            HorizonDays = horizonDays,
            Unit = unit
        };

    public void Update(decimal quantityPerPersonPerDay, int horizonDays, string unit)
    {
        QuantityPerPersonPerDay = quantityPerPersonPerDay;
        HorizonDays = horizonDays;
        Unit = unit;
        MarkUpdated();
    }

    public decimal RequiredTotal(int memberCount) =>
        QuantityPerPersonPerDay * HorizonDays * memberCount;
}
