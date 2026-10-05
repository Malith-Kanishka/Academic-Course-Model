using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ACM.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRemedialPlanEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"RemedialPlans\" WHERE \"StudentId\" NOT IN (SELECT \"Id\" FROM \"Users\");");

            migrationBuilder.AddColumn<string>(
                name: "ExpectedStandard",
                table: "RemedialPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StudentSubmission",
                table: "RemedialPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_StudySessions_TopicId",
                table: "StudySessions",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_RemedialPlans_StudentId",
                table: "RemedialPlans",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_RemedialPlans_Users_StudentId",
                table: "RemedialPlans",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StudySessions_Topics_TopicId",
                table: "StudySessions",
                column: "TopicId",
                principalTable: "Topics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RemedialPlans_Users_StudentId",
                table: "RemedialPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_StudySessions_Topics_TopicId",
                table: "StudySessions");

            migrationBuilder.DropIndex(
                name: "IX_StudySessions_TopicId",
                table: "StudySessions");

            migrationBuilder.DropIndex(
                name: "IX_RemedialPlans_StudentId",
                table: "RemedialPlans");

            migrationBuilder.DropColumn(
                name: "ExpectedStandard",
                table: "RemedialPlans");

            migrationBuilder.DropColumn(
                name: "StudentSubmission",
                table: "RemedialPlans");
        }
    }
}
