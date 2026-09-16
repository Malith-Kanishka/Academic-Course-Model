using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configure Entity Framework Core with PostgreSQL (Supabase)
// It grabs the string we just put in appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Register your Member 3 Services (Dependency Injection)
// This tells the API: "Whenever a controller asks for ISessionService, give them SessionService"
builder.Services.AddScoped<ISessionService, SessionService>();

// (Your teammates will add their services here later)
// builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// 4. Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger provides a nice UI to test your endpoints in the browser
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();