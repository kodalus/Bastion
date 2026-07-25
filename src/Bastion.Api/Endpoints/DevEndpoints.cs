using Bastion.Infrastructure.Jobs;
using Quartz;

namespace Bastion.Api.Endpoints;

public static class DevEndpoints
{
    public static void MapDevEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dev").WithTags("Dev");

        group.MapPost("/trigger-scan", async (ISchedulerFactory schedulerFactory, CancellationToken ct) =>
        {
            var scheduler = await schedulerFactory.GetScheduler(ct);
            await scheduler.TriggerJob(new JobKey("ExpiryScanJob"), ct);
            await scheduler.TriggerJob(new JobKey("MaintenanceDueJob"), ct);
            return Results.Accepted(null, new { message = "Scan jobs triggered." });
        });

        group.MapPost("/trigger-dispatch", async (ISchedulerFactory schedulerFactory, CancellationToken ct) =>
        {
            var scheduler = await schedulerFactory.GetScheduler(ct);
            await scheduler.TriggerJob(new JobKey("NotificationDispatchJob"), ct);
            return Results.Accepted(null, new { message = "Dispatch job triggered." });
        });
    }
}
