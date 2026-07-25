using Bastion.Application.Locations;
using Bastion.Application.Supplies;
using Microsoft.Extensions.DependencyInjection;

namespace Bastion.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<ISupplyService, SupplyService>();
        return services;
    }
}
