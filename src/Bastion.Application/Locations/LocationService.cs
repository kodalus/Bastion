using Bastion.Application.Locations.Dtos;
using Bastion.Domain.Aggregates.Locations;

namespace Bastion.Application.Locations;

public interface ILocationService
{
    Task<IReadOnlyList<StorageLocationDto>> GetAllAsync(CancellationToken ct = default);
    Task<StorageLocationDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<StorageLocationDto> CreateAsync(CreateLocationRequest request, CancellationToken ct = default);
    Task<StorageLocationDto?> UpdateAsync(Guid id, UpdateLocationRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}

public class LocationService(ILocationRepository repository) : ILocationService
{
    public async Task<IReadOnlyList<StorageLocationDto>> GetAllAsync(CancellationToken ct = default)
    {
        var locations = await repository.GetAllAsync(ct);
        return locations.Select(ToDto).ToList();
    }

    public async Task<StorageLocationDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var location = await repository.GetByIdAsync(id, ct);
        return location is null ? null : ToDto(location);
    }

    public async Task<StorageLocationDto> CreateAsync(CreateLocationRequest request, CancellationToken ct = default)
    {
        var location = StorageLocation.Create(request.Name, request.Description);
        await repository.AddAsync(location, ct);
        return ToDto(location);
    }

    public async Task<StorageLocationDto?> UpdateAsync(Guid id, UpdateLocationRequest request, CancellationToken ct = default)
    {
        var location = await repository.GetByIdAsync(id, ct);
        if (location is null) return null;
        location.Update(request.Name, request.Description);
        await repository.SaveAsync(ct);
        return ToDto(location);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var location = await repository.GetByIdAsync(id, ct);
        if (location is null) return false;
        await repository.RemoveAsync(location, ct);
        return true;
    }

    private static StorageLocationDto ToDto(StorageLocation l) =>
        new(l.Id, l.Name, l.Description);
}

public interface ILocationRepository
{
    Task<IReadOnlyList<StorageLocation>> GetAllAsync(CancellationToken ct = default);
    Task<StorageLocation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(StorageLocation location, CancellationToken ct = default);
    Task RemoveAsync(StorageLocation location, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
