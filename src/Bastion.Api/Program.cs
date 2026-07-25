using System.Text.Json.Serialization;
using Bastion.Application;
using Bastion.Api.Endpoints;
using Bastion.Infrastructure;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Bastion API", Version = "v1" });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapHouseholdEndpoints();
app.MapLocationEndpoints();
app.MapSupplyEndpoints();
app.MapTargetEndpoints();
app.MapDashboardEndpoints();
app.MapEquipmentEndpoints();

if (app.Environment.IsDevelopment())
    app.MapDevEndpoints();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedAsync(db);
}

app.Run();

public partial class Program { }
