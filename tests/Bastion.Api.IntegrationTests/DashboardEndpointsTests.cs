using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Bastion.Api.IntegrationTests;

[Collection("Integration")]
public class DashboardEndpointsTests(BastionWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetReadiness_ReturnsOkWithValidScore()
    {
        var response = await _client.GetAsync("/api/dashboard/readiness");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var score = json.GetProperty("overallScore").GetDecimal();
        Assert.InRange(score, 0m, 100m);
    }

    [Fact]
    public async Task GetReadiness_ContainsCategoryScores()
    {
        var response = await _client.GetAsync("/api/dashboard/readiness");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(json.TryGetProperty("categoryScores", out var cats));
        Assert.True(cats.GetArrayLength() > 0);
    }

    [Fact]
    public async Task GetReadiness_EquipmentScoreIsWithinRange()
    {
        var response = await _client.GetAsync("/api/dashboard/readiness");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(json.TryGetProperty("equipmentScore", out var equipScore));
        var score = equipScore.GetDecimal();
        Assert.InRange(score, 0m, 100m);
    }
}
