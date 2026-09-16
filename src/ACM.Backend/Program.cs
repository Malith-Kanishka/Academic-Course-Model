using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add API Controllers and Swagger documentation
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Enable CORS so your React web app and Flutter mobile app can communicate with the backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Member 4 (Rashmika) Approval & Evaluation Service
builder.Services.AddSingleton<IApprovalService, ApprovalService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();