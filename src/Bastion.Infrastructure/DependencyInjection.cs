using Bastion.Application.Catalog;
using Bastion.Application.Dashboard;
using Bastion.Application.Equipment;
using Bastion.Application.Locations;
using Bastion.Application.Notifications;
using Bastion.Application.Scenarios;
using Bastion.Application.Supplies;
using Bastion.Application.Targets;
using Bastion.Infrastructure.Email;
using Bastion.Infrastructure.Jobs;
using Bastion.Infrastructure.Persistence;
using Bastion.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Quartz;

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

        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<ISupplyRepository, SupplyRepository>();
        services.AddScoped<ITargetLevelRepository, TargetLevelRepository>();
        services.AddScoped<IHouseholdRepository, HouseholdRepository>();
        services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IScenarioRepository, ScenarioRepository>();

        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.AddScoped<IEmailService, EmailService>();

        services.AddQuartz(q =>
        {
            q.AddJob<ExpiryScanJob>(j => j.WithIdentity("ExpiryScanJob"));
            q.AddTrigger(t => t
                .ForJob("ExpiryScanJob")
                .WithIdentity("ExpiryScanJob-trigger")
                .WithCronSchedule("0 0 6 * * ?"));   // 06:00 daily

            q.AddJob<MaintenanceDueJob>(j => j.WithIdentity("MaintenanceDueJob"));
            q.AddTrigger(t => t
                .ForJob("MaintenanceDueJob")
                .WithIdentity("MaintenanceDueJob-trigger")
                .WithCronSchedule("0 5 6 * * ?"));   // 06:05 daily

            q.AddJob<NotificationDispatchJob>(j => j.WithIdentity("NotificationDispatchJob"));
            q.AddTrigger(t => t
                .ForJob("NotificationDispatchJob")
                .WithIdentity("NotificationDispatchJob-trigger")
                .WithCronSchedule("0 30 6 * * ?"));  // 06:30 daily
        });
        services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

        return services;
    }
}
