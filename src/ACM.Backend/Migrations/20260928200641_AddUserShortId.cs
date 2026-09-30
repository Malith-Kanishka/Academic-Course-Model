using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ACM.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserShortId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShortId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_ShortId",
                table: "Users",
                column: "ShortId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_ShortId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShortId",
                table: "Users");
        }
    }
}
