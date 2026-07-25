using Bastion.Domain.Aggregates.Equipment;
using Bastion.Domain.Aggregates.Households;
using Bastion.Domain.Aggregates.Locations;
using Bastion.Domain.Aggregates.Notifications;
using Bastion.Domain.Aggregates.Scenarios;
using Bastion.Domain.Aggregates.Supplies;
using Bastion.Domain.Aggregates.Targets;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Household> Households => Set<Household>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<StorageLocation> StorageLocations => Set<StorageLocation>();
    public DbSet<SupplyItem> SupplyItems => Set<SupplyItem>();
    public DbSet<TargetLevel> TargetLevels => Set<TargetLevel>();
    public DbSet<Domain.Aggregates.Equipment.Equipment> Equipment => Set<Domain.Aggregates.Equipment.Equipment>();
    public DbSet<MaintenanceTask> MaintenanceTasks => Set<MaintenanceTask>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<ChecklistItem> ChecklistItems => Set<ChecklistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.Entity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.MarkUpdated();
        }
    }
}
