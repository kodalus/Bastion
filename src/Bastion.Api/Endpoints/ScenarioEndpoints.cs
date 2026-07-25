using Bastion.Application.Dashboard;
using Bastion.Application.Scenarios;
using Bastion.Domain.Aggregates.Scenarios;

namespace Bastion.Api.Endpoints;

public static class ScenarioEndpoints
{
    public static void MapScenarioEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/scenarios").WithTags("Scenarios");

        group.MapGet("/", async (IScenarioRepository repo, IHouseholdRepository households, CancellationToken ct) =>
        {
            var household = await households.GetFirstAsync(ct);
            if (household is null) return Results.NotFound();
            var scenarios = await repo.GetAllAsync(household.Id, ct);
            return Results.Ok(scenarios.Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                ItemCount = s.Items.Count,
                CompletedCount = s.Items.Count(i => i.IsCompleted)
            }));
        });

        group.MapGet("/{id:guid}", async (Guid id, IScenarioRepository repo, CancellationToken ct) =>
        {
            var scenario = await repo.GetByIdAsync(id, ct);
            if (scenario is null) return Results.NotFound();
            return Results.Ok(ToDto(scenario));
        });

        group.MapPost("/", async (CreateScenarioRequest req, IScenarioRepository repo, IHouseholdRepository households, CancellationToken ct) =>
        {
            var household = await households.GetFirstAsync(ct);
            if (household is null) return Results.NotFound();
            var scenario = Scenario.Create(household.Id, req.Name, req.Description ?? string.Empty);
            await repo.AddAsync(scenario, ct);
            await repo.SaveAsync(ct);
            return Results.Created($"/api/scenarios/{scenario.Id}", ToDto(scenario));
        });

        group.MapDelete("/{id:guid}", async (Guid id, IScenarioRepository repo, CancellationToken ct) =>
        {
            await repo.DeleteAsync(id, ct);
            await repo.SaveAsync(ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:guid}/items", async (Guid id, AddChecklistItemRequest req, IScenarioRepository repo, CancellationToken ct) =>
        {
            var scenario = await repo.GetByIdAsync(id, ct);
            if (scenario is null) return Results.NotFound();
            var sortOrder = scenario.Items.Count > 0 ? scenario.Items.Max(i => i.SortOrder) + 1 : 1;
            var item = scenario.AddItem(req.Text, sortOrder);
            await repo.SaveAsync(ct);
            return Results.Created($"/api/scenarios/{id}/items/{item.Id}", new { item.Id, item.Text, item.SortOrder, item.IsCompleted });
        });

        group.MapDelete("/{id:guid}/items/{itemId:guid}", async (Guid id, Guid itemId, IScenarioRepository repo, CancellationToken ct) =>
        {
            var scenario = await repo.GetByIdAsync(id, ct);
            if (scenario is null) return Results.NotFound();
            scenario.RemoveItem(itemId);
            await repo.SaveAsync(ct);
            return Results.NoContent();
        });

        group.MapPut("/{id:guid}/items/{itemId:guid}/toggle", async (Guid id, Guid itemId, IScenarioRepository repo, CancellationToken ct) =>
        {
            var scenario = await repo.GetByIdAsync(id, ct);
            if (scenario is null) return Results.NotFound();
            var item = scenario.Items.FirstOrDefault(i => i.Id == itemId);
            if (item is null) return Results.NotFound();
            item.Toggle();
            await repo.SaveAsync(ct);
            return Results.Ok(new { item.Id, item.IsCompleted });
        });

        group.MapPost("/{id:guid}/reset", async (Guid id, IScenarioRepository repo, CancellationToken ct) =>
        {
            var scenario = await repo.GetByIdAsync(id, ct);
            if (scenario is null) return Results.NotFound();
            scenario.ResetAll();
            await repo.SaveAsync(ct);
            return Results.Ok();
        });
    }

    private static object ToDto(Scenario s) => new
    {
        s.Id,
        s.Name,
        s.Description,
        Items = s.Items.OrderBy(i => i.SortOrder).Select(i => new
        {
            i.Id,
            i.Text,
            i.SortOrder,
            i.IsCompleted
        })
    };
}

public record CreateScenarioRequest(string Name, string? Description);
public record AddChecklistItemRequest(string Text);
