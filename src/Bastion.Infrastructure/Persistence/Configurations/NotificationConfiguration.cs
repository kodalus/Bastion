using Bastion.Domain.Aggregates.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Subject).HasMaxLength(500).IsRequired();
        builder.Property(n => n.Body).IsRequired();
        builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(n => new { n.HouseholdId, n.Type, n.ScheduledFor });
    }
}
