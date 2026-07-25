using Bastion.Application.Locations;
using Bastion.Application.Locations.Dtos;

namespace Bastion.Api.Endpoints;

public static class LocationEndpoints
{
    public static IEndpointRouteBuilder MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/locations").WithTags("Locations");

        group.MapGet("/", async (ILocationService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, ILocationService svc, CancellationToken ct) =>
        {
            var location = await svc.GetByIdAsync(id, ct);
            return location is null ? Results.NotFound() : Results.Ok(location);
        }).WithName("GetLocation");

        group.MapPost("/", async (CreateLocationRequest request, ILocationService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(request, ct);
            return Results.CreatedAtRoute("GetLocation", new { id = created.Id }, created);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateLocationRequest request, ILocationService svc, CancellationToken ct) =>
        {
            var updated = await svc.UpdateAsync(id, request, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapDelete("/{id:guid}", async (Guid id, ILocationService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return app;
    }
}
