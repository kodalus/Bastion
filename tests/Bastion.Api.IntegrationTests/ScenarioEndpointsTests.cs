using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Bastion.Api.IntegrationTests;

[Collection("Integration")]
public class ScenarioEndpointsTests(BastionWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsSeededScenarios()
    {
        var response = await _client.GetAsync("/api/scenarios");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var scenarios = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        Assert.NotNull(scenarios);
        Assert.True(scenarios!.Count >= 4, $"Expected at least 4 seeded scenarios, got {scenarios.Count}");
    }

    [Fact]
    public async Task Create_ReturnsCreated_WithEmptyItemList()
    {
        var response = await _client.PostAsJsonAsync("/api/scenarios", new
        {
            name = "Test Scenario",
            description = "Integration test scenario"
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Test Scenario", json.GetProperty("name").GetString());
        Assert.Equal(0, json.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task AddItem_And_Toggle_WorksEndToEnd()
    {
        // Create scenario
        var createResp = await _client.PostAsJsonAsync("/api/scenarios", new
        {
            name = "E2E Test Scenario",
            description = ""
        });
        createResp.EnsureSuccessStatusCode();
        var scenario = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var scenarioId = scenario.GetProperty("id").GetString()!;

        // Add checklist item
        var addResp = await _client.PostAsJsonAsync($"/api/scenarios/{scenarioId}/items", new { text = "Step one" });
        Assert.Equal(HttpStatusCode.Created, addResp.StatusCode);
        var item = await addResp.Content.ReadFromJsonAsync<JsonElement>();
        var itemId = item.GetProperty("id").GetString()!;
        Assert.False(item.GetProperty("isCompleted").GetBoolean());

        // Toggle item
        var toggleResp = await _client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/items/{itemId}/toggle", new { });
        Assert.Equal(HttpStatusCode.OK, toggleResp.StatusCode);
        var toggled = await toggleResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(toggled.GetProperty("isCompleted").GetBoolean());

        // Reset all
        var resetResp = await _client.PostAsJsonAsync($"/api/scenarios/{scenarioId}/reset", new { });
        Assert.Equal(HttpStatusCode.OK, resetResp.StatusCode);

        // Verify item is unchecked after reset
        var detailResp = await _client.GetAsync($"/api/scenarios/{scenarioId}");
        var detail = await detailResp.Content.ReadFromJsonAsync<JsonElement>();
        var items = detail.GetProperty("items").EnumerateArray().ToList();
        Assert.All(items, i => Assert.False(i.GetProperty("isCompleted").GetBoolean()));
    }

    [Fact]
    public async Task Delete_Scenario_Returns204()
    {
        var createResp = await _client.PostAsJsonAsync("/api/scenarios", new
        {
            name = "Scenario to Delete",
            description = ""
        });
        var json = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var id = json.GetProperty("id").GetString()!;

        var deleteResp = await _client.DeleteAsync($"/api/scenarios/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }
}
