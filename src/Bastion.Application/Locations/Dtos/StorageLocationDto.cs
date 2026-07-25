namespace Bastion.Application.Locations.Dtos;

public record StorageLocationDto(Guid Id, string Name, string? Description);

public record CreateLocationRequest(string Name, string? Description);

public record UpdateLocationRequest(string Name, string? Description);
