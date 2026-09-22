using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
    
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<KnowledgeAuditorService>();

// Register PostgreSQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHttpClient<KnowledgeAuditorService>(client =>
{
    client.BaseAddress = new Uri("http://localhost:8000/"); // Python FastAPI server URL
});


// Register the Curriculum Service
builder.Services.AddScoped<CurriculumService>();

// Enable CORS for React web app and Flutter mobile app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Member 3 Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<ISessionService, SessionService>();

// Register Member 4 Approval & Evaluation Service
builder.Services.AddSingleton<IApprovalService, ApprovalService>();

var app = builder.Build();

app.UseCors("AllowAll");

// Enable Swagger unconditionally for testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ACM Backend API V1");
    c.RoutePrefix = string.Empty; // This makes Swagger open automatically at the root URL (http://localhost:xxxx/)!
});

app.UseAuthorization();
app.MapControllers();

app.Run();