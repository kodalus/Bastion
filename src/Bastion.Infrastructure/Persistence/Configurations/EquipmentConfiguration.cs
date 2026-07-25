using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bastion.Infrastructure.Persistence.Configurations;

public class EquipmentConfiguration : IEntityTypeConfiguration<Domain.Aggregates.Equipment.Equipment>
{
    public void Configure(EntityTypeBuilder<Domain.Aggregates.Equipment.Equipment> builder)
    {
        builder.ToTable("Equipment");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Category).IsRequired().HasConversion<string>();
        builder.Property(e => e.PurchaseDate).IsRequired();
        builder.Property(e => e.HouseholdId).IsRequired();

        builder.HasMany(e => e.Tasks)
            .WithOne()
            .HasForeignKey(t => t.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(e => e.Tasks)
            .UsePropertyAccessMode(PropertyAccessMode.Field)
            .HasField("_tasks");
    }
}
