using Bastion.Domain.Aggregates.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class EquipmentCatalogItemConfiguration : IEntityTypeConfiguration<EquipmentCatalogItem>
{
    public void Configure(EntityTypeBuilder<EquipmentCatalogItem> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Hint).HasMaxLength(500);
        builder.Property(x => x.Category).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.Price).HasPrecision(10, 2);
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
