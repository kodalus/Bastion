using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bastion.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplyItemIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SupplyItems_ExpiryDate",
                table: "SupplyItems",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_SupplyItems_StorageLocationId",
                table: "SupplyItems",
                column: "StorageLocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SupplyItems_ExpiryDate",
                table: "SupplyItems");

            migrationBuilder.DropIndex(
                name: "IX_SupplyItems_StorageLocationId",
                table: "SupplyItems");
        }
    }
}
