using Bastion.Application.Supplies;
using Bastion.Application.Supplies.Dtos;

namespace Bastion.Api.Endpoints;

public static class SupplyEndpoints
{
    public static IEndpointRouteBuilder MapSupplyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/supplies").WithTags("Supplies");

        group.MapGet("/", async (ISupplyService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, ISupplyService svc, CancellationToken ct) =>
        {
            var item = await svc.GetByIdAsync(id, ct);
            return item is null ? Results.NotFound() : Results.Ok(item);
        }).WithName("GetSupply");

        group.MapPost("/", async (CreateSupplyItemRequest request, ISupplyService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(request, ct);
            return Results.CreatedAtRoute("GetSupply", new { id = created.Id }, created);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateSupplyItemRequest request, ISupplyService svc, CancellationToken ct) =>
        {
            var updated = await svc.UpdateAsync(id, request, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        });

        group.MapDelete("/{id:guid}", async (Guid id, ISupplyService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return app;
    }
}
