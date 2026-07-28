using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bastion.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsConsumableToTargetLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsConsumable",
                table: "TargetLevels",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // Tools and Documents have no daily consumption rate — binary scoring
            migrationBuilder.Sql(
                "UPDATE \"TargetLevels\" SET \"IsConsumable\" = false WHERE \"Category\" IN ('Tools', 'Documents')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsConsumable",
                table: "TargetLevels");
        }
    }
}
