using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Households;

public class Household : Entity
{
    public string Name { get; private set; } = string.Empty;
    public IReadOnlyList<Member> Members => _members.AsReadOnly();

    private readonly List<Member> _members = [];

    private Household() { }

    public static Household Create(string name) => new() { Name = name };

    public Member AddMember(string memberName, int ageYears)
    {
        var member = new Member(Guid.NewGuid(), memberName, ageYears, Id);
        _members.Add(member);
        MarkUpdated();
        return member;
    }

    public int MemberCount => _members.Count;
}
