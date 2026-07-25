using Bastion.Domain.Aggregates.Equipment;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class MaintenanceTaskConfiguration : IEntityTypeConfiguration<MaintenanceTask>
{
    public void Configure(EntityTypeBuilder<MaintenanceTask> builder)
    {
        builder.ToTable("MaintenanceTasks");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Description).IsRequired().HasMaxLength(500);
        builder.Property(t => t.IntervalDays).IsRequired();
        builder.Property(t => t.LastCompletedAt);
        builder.Property(t => t.BaseDueDate).IsRequired();
        builder.Property(t => t.EquipmentId).IsRequired();

        builder.Ignore(t => t.NextDueAt);
    }
}
