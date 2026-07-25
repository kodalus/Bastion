using Bastion.Domain.Aggregates.Supplies;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class SupplyItemConfiguration : IEntityTypeConfiguration<SupplyItem>
{
    public void Configure(EntityTypeBuilder<SupplyItem> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Category).IsRequired().HasConversion<string>();
        builder.Property(s => s.Quantity).IsRequired().HasPrecision(12, 3);
        builder.Property(s => s.Unit).IsRequired().HasMaxLength(50);
        builder.Property(s => s.EstimatedPricePerUnit).HasPrecision(12, 2);
    }
}
