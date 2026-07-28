using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bastion.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWeightToTargetLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "TargetLevels",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 1m);

            // Set domain-defined default weights per category
            migrationBuilder.Sql(@"
                UPDATE ""TargetLevels"" SET ""Weight"" = 3.0  WHERE ""Category"" = 'Water';
                UPDATE ""TargetLevels"" SET ""Weight"" = 3.0  WHERE ""Category"" = 'Food';
                UPDATE ""TargetLevels"" SET ""Weight"" = 2.0  WHERE ""Category"" = 'Medical';
                UPDATE ""TargetLevels"" SET ""Weight"" = 1.0  WHERE ""Category"" = 'Hygiene';
                UPDATE ""TargetLevels"" SET ""Weight"" = 1.0  WHERE ""Category"" = 'Energy';
                UPDATE ""TargetLevels"" SET ""Weight"" = 0.5  WHERE ""Category"" = 'Tools';
                UPDATE ""TargetLevels"" SET ""Weight"" = 0.5  WHERE ""Category"" = 'Documents';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Weight",
                table: "TargetLevels");
        }
    }
}
