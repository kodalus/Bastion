using Bastion.Application.Dashboard;

namespace Bastion.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard/readiness", async (IDashboardService svc, CancellationToken ct) =>
        {
            var result = await svc.GetReadinessAsync(ct);
            return result is null ? Results.NotFound("No household configured.") : Results.Ok(result);
        }).WithTags("Dashboard");
    }
}
