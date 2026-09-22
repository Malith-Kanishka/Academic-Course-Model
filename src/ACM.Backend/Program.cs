using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // Member 1 - accept/return role names (e.g. "Student") instead of raw integers
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SupportNonNullableReferenceTypes();
    c.UseInlineDefinitionsForEnums();
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Member 1 - JWT Bearer auth support in Swagger UI (adds the "Authorize" button)
    c.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT access token (from POST /api/auth/login). No need to type 'Bearer ' prefix."
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("bearer", document)] = []
    });
});
builder.Services.AddScoped<KnowledgeAuditorService>();

// Register PostgreSQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ACMDbContext>(options =>
    options.UseNpgsql(connectionString));

// Member 1 - JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:Secret"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ACM.Backend";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ACM.Users";

if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT Secret is not configured in appsettings");
}

var key = Encoding.ASCII.GetBytes(jwtSecret);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Member 1 - Register User Services
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddScoped<IUserService, UserService>();
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

// Member 1 - Authentication Middleware
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Member 1 - Seed Database with Test Data
await app.SeedDatabaseAsync();

app.Run();