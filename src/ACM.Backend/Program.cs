using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;
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
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpClient<KnowledgeAuditorService>(client =>
{
    client.BaseAddress = new Uri("http://localhost:8000/"); // Python FastAPI server URL
});


// Register the Curriculum Service
builder.Services.AddScoped<CurriculumService>();

var app = builder.Build();

// Enable Swagger unconditionally for testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ACM Backend API V1");
    c.RoutePrefix = string.Empty; // This makes Swagger open automatically at the root URL (http://localhost:xxxx/)!
});

// Configure the HTTP request pipeline
app.MapControllers();

app.Run();