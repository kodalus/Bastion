using Bastion.Application.Equipment;
using Bastion.Application.Equipment.Dtos;

namespace Bastion.Api.Endpoints;

public static class EquipmentEndpoints
{
    public static void MapEquipmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/households/{householdId:guid}/equipment")
            .WithTags("Equipment");

        group.MapGet("/", async (Guid householdId, IEquipmentService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetByHouseholdAsync(householdId, ct)));

        group.MapPost("/", async (Guid householdId, CreateEquipmentRequest req, IEquipmentService svc, CancellationToken ct) =>
        {
            var dto = await svc.CreateAsync(householdId, req, ct);
            return Results.CreatedAtRoute("GetEquipment", new { id = dto.Id }, dto);
        });

        app.MapGet("/api/equipment/{id:guid}", async (Guid id, IEquipmentService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        }).WithName("GetEquipment").WithTags("Equipment");

        app.MapPut("/api/equipment/{id:guid}", async (Guid id, UpdateEquipmentRequest req, IEquipmentService svc, CancellationToken ct) =>
        {
            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        }).WithTags("Equipment");

        app.MapDelete("/api/equipment/{id:guid}", async (Guid id, IEquipmentService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        }).WithTags("Equipment");

        // Maintenance tasks
        app.MapPost("/api/equipment/{equipmentId:guid}/tasks",
            async (Guid equipmentId, CreateMaintenanceTaskRequest req, IEquipmentService svc, CancellationToken ct) =>
            {
                var dto = await svc.AddTaskAsync(equipmentId, req, ct);
                return dto is null ? Results.NotFound() : Results.Ok(dto);
            }).WithTags("Equipment");

        app.MapPut("/api/equipment/{equipmentId:guid}/tasks/{taskId:guid}",
            async (Guid equipmentId, Guid taskId, UpdateMaintenanceTaskRequest req, IEquipmentService svc, CancellationToken ct) =>
            {
                var dto = await svc.UpdateTaskAsync(equipmentId, taskId, req, ct);
                return dto is null ? Results.NotFound() : Results.Ok(dto);
            }).WithTags("Equipment");

        app.MapPost("/api/equipment/{equipmentId:guid}/tasks/{taskId:guid}/complete",
            async (Guid equipmentId, Guid taskId, IEquipmentService svc, CancellationToken ct) =>
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var dto = await svc.CompleteTaskAsync(equipmentId, taskId, today, ct);
                return dto is null ? Results.NotFound() : Results.Ok(dto);
            }).WithTags("Equipment");

        app.MapDelete("/api/equipment/{equipmentId:guid}/tasks/{taskId:guid}",
            async (Guid equipmentId, Guid taskId, IEquipmentService svc, CancellationToken ct) =>
            {
                var deleted = await svc.DeleteTaskAsync(equipmentId, taskId, ct);
                return deleted ? Results.NoContent() : Results.NotFound();
            }).WithTags("Equipment");
    }
}
