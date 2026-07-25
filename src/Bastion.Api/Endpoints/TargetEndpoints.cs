using Bastion.Application.Targets;
using Bastion.Application.Targets.Dtos;

namespace Bastion.Api.Endpoints;

public static class TargetEndpoints
{
    public static void MapTargetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/households/{householdId:guid}/targets")
            .WithTags("Targets");

        group.MapGet("/", async (Guid householdId, ITargetLevelService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetByHouseholdAsync(householdId, ct)));

        group.MapPost("/", async (Guid householdId, CreateTargetLevelRequest req, ITargetLevelService svc, CancellationToken ct) =>
        {
            var dto = await svc.CreateAsync(req with { HouseholdId = householdId }, ct);
            return Results.CreatedAtRoute("GetTarget", new { id = dto.Id }, dto);
        });

        app.MapGet("/api/targets/{id:guid}", async (Guid id, ITargetLevelService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        }).WithName("GetTarget").WithTags("Targets");

        app.MapPut("/api/targets/{id:guid}", async (Guid id, UpdateTargetLevelRequest req, ITargetLevelService svc, CancellationToken ct) =>
        {
            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        }).WithTags("Targets");

        app.MapDelete("/api/targets/{id:guid}", async (Guid id, ITargetLevelService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        }).WithTags("Targets");
    }
}
