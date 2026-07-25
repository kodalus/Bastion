namespace Bastion.Domain.Aggregates.Households;

public class Member
{
    public Guid Id { get; }
    public string Name { get; private set; }
    public int AgeYears { get; private set; }
    public Guid HouseholdId { get; }

    internal Member(Guid id, string name, int ageYears, Guid householdId)
    {
        Id = id;
        Name = name;
        AgeYears = ageYears;
        HouseholdId = householdId;
    }
}
