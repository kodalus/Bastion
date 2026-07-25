using Bastion.Application.Dashboard;
using Bastion.Application.Locations;
using Bastion.Application.Supplies;
using Bastion.Application.Targets;
using Bastion.Infrastructure.Persistence;
using Bastion.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Bastion.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<ISupplyRepository, SupplyRepository>();
        services.AddScoped<ITargetLevelRepository, TargetLevelRepository>();
        services.AddScoped<IHouseholdRepository, HouseholdRepository>();

        return services;
    }
}
