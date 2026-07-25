using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Application.Targets.Dtos;

public record TargetLevelDto(
    Guid Id,
    Guid HouseholdId,
    SupplyCategory Category,
    decimal QuantityPerPersonPerDay,
    int HorizonDays,
    string Unit,
    decimal RequiredTotal);

public record CreateTargetLevelRequest(
    Guid HouseholdId,
    SupplyCategory Category,
    decimal QuantityPerPersonPerDay,
    int HorizonDays,
    string Unit);

public record UpdateTargetLevelRequest(
    decimal QuantityPerPersonPerDay,
    int HorizonDays,
    string Unit);
