using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ACM.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AgentAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentName = table.Column<string>(type: "text", nullable: false),
                    InputPayloadJson = table.Column<string>(type: "text", nullable: false),
                    OutputPayloadJson = table.Column<string>(type: "text", nullable: false),
                    TriggeredHumanInLoop = table.Column<bool>(type: "boolean", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MasteryReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicName = table.Column<string>(type: "text", nullable: false),
                    MasteryScore = table.Column<int>(type: "integer", nullable: false),
                    FlaggedMisconceptions = table.Column<List<string>>(type: "text[]", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasteryReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RemedialPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MasteryReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionItems = table.Column<List<string>>(type: "text[]", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "text", nullable: false),
                    ProfessorNotes = table.Column<string>(type: "text", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RemedialPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RemedialPlans_MasteryReports_MasteryReportId",
                        column: x => x.MasteryReportId,
                        principalTable: "MasteryReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Decision = table.Column<string>(type: "text", nullable: false),
                    ProfessorFeedback = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalLogs_RemedialPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "RemedialPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalLogs_PlanId",
                table: "ApprovalLogs",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_RemedialPlans_MasteryReportId",
                table: "RemedialPlans",
                column: "MasteryReportId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentAuditLogs");

            migrationBuilder.DropTable(
                name: "ApprovalLogs");

            migrationBuilder.DropTable(
                name: "RemedialPlans");

            migrationBuilder.DropTable(
                name: "MasteryReports");
        }
    }
}
