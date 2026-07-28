using Bastion.Application.Catalog;

namespace Bastion.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/catalog").WithTags("Catalog");

        group.MapGet("/supplies", async (ICatalogService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetSupplyItemsAsync(ct)));

        group.MapGet("/equipment", async (ICatalogService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetEquipmentItemsAsync(ct)));

        group.MapPut("/supplies/{id:guid}/price", async (
            Guid id, SetPriceRequest req, ICatalogService svc, CancellationToken ct) =>
            await svc.SetSupplyPriceAsync(id, req.Price, ct) ? Results.NoContent() : Results.NotFound());

        group.MapPut("/equipment/{id:guid}/price", async (
            Guid id, SetPriceRequest req, ICatalogService svc, CancellationToken ct) =>
            await svc.SetEquipmentPriceAsync(id, req.Price, ct) ? Results.NoContent() : Results.NotFound());

        return app;
    }
}
