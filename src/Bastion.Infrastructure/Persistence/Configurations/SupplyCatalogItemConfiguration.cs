using Bastion.Domain.Aggregates.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class SupplyCatalogItemConfiguration : IEntityTypeConfiguration<SupplyCatalogItem>
{
    public void Configure(EntityTypeBuilder<SupplyCatalogItem> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Unit).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Category).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.SuggestedQty).HasPrecision(10, 3);
        builder.Property(x => x.Price).HasPrecision(10, 2);
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
