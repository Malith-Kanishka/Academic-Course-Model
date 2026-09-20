using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add API Controllers and Swagger documentation
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Enable CORS for React web app and Flutter mobile app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Configure Entity Framework Core with PostgreSQL (Supabase)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(connectionString));

// 4. Register Member 3 Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<ISessionService, SessionService>();

// 5. Register Member 4 Approval & Evaluation Service
builder.Services.AddSingleton<IApprovalService, ApprovalService>();

var app = builder.Build();

// 6. Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ACM Backend API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();