using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Register PostgreSQL Database Context
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline
app.MapControllers();

app.Run();