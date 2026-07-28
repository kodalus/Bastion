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
    // false for categories with no daily rate (Tools, Documents): binary have/don't-have scoring
    public bool IsConsumable { get; private set; }
    // Weight in the overall readiness score. High-priority categories are locked.
    public decimal Weight { get; private set; }
    // Derived: Water/Food/Medical weights cannot be changed by the user
    public bool IsWeightLocked => Category is SupplyCategory.Water or SupplyCategory.Food or SupplyCategory.Medical;

    private static readonly Dictionary<SupplyCategory, decimal> DefaultWeights = new()
    {
        [SupplyCategory.Water]     = 3m,
        [SupplyCategory.Food]      = 3m,
        [SupplyCategory.Medical]   = 2m,
        [SupplyCategory.Hygiene]   = 1m,
        [SupplyCategory.Energy]    = 1m,
        [SupplyCategory.Tools]     = 0.5m,
        [SupplyCategory.Documents] = 0.5m,
    };

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
            Unit = unit,
            IsConsumable = category is not (SupplyCategory.Tools or SupplyCategory.Documents),
            Weight = DefaultWeights.GetValueOrDefault(category, 1m),
        };

    public void Update(decimal quantityPerPersonPerDay, int horizonDays, string unit)
    {
        QuantityPerPersonPerDay = quantityPerPersonPerDay;
        HorizonDays = horizonDays;
        Unit = unit;
        MarkUpdated();
    }

    public void UpdateWeight(decimal weight)
    {
        if (IsWeightLocked)
            throw new InvalidOperationException($"Weight for {Category} (High priority) cannot be changed.");
        if (weight < 0.5m)
            throw new ArgumentOutOfRangeException(nameof(weight), "Weight must be at least 0.5.");
        Weight = weight;
        MarkUpdated();
    }

    // For consumable: qppd × horizon × members. For non-consumable: flat qppd (absolute count).
    public decimal RequiredTotal(int memberCount) =>
        IsConsumable
            ? QuantityPerPersonPerDay * HorizonDays * memberCount
            : QuantityPerPersonPerDay;
}
