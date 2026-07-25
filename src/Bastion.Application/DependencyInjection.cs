using Bastion.Application.Dashboard;
using Bastion.Application.Equipment;
using Bastion.Application.Locations;
using Bastion.Application.Supplies;
using Bastion.Application.Targets;
using Microsoft.Extensions.DependencyInjection;

namespace Bastion.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<ISupplyService, SupplyService>();
        services.AddScoped<ITargetLevelService, TargetLevelService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IEquipmentService, EquipmentService>();
        return services;
    }
}
