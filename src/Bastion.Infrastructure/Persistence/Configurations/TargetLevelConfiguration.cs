using Bastion.Domain.Aggregates.Targets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class TargetLevelConfiguration : IEntityTypeConfiguration<TargetLevel>
{
    public void Configure(EntityTypeBuilder<TargetLevel> builder)
    {
        builder.ToTable("TargetLevels");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.HouseholdId).IsRequired();
        builder.Property(t => t.Category).IsRequired().HasConversion<string>();
        builder.Property(t => t.QuantityPerPersonPerDay).IsRequired().HasColumnType("numeric(18,4)");
        builder.Property(t => t.HorizonDays).IsRequired();
        builder.Property(t => t.Unit).IsRequired().HasMaxLength(20);
        builder.Property(t => t.IsConsumable).IsRequired().HasDefaultValue(true);

        builder.HasIndex(t => new { t.HouseholdId, t.Category }).IsUnique();
    }
}
