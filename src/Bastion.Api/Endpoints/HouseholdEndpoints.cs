using Bastion.Application.Dashboard;

namespace Bastion.Api.Endpoints;

public static class HouseholdEndpoints
{
    public static void MapHouseholdEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/households/current", async (IHouseholdRepository repo, CancellationToken ct) =>
        {
            var h = await repo.GetFirstAsync(ct);
            return h is null
                ? Results.NotFound()
                : Results.Ok(new { id = h.Id, name = h.Name, memberCount = h.MemberCount });
        }).WithTags("Households");
    }
}
