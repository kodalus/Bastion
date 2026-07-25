using System.Net;
using System.Net.Http.Json;
using Bastion.Domain.Aggregates.Supplies;

namespace Bastion.Api.IntegrationTests;

[Collection("Integration")]
public class SupplyEndpointsTests(BastionWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsOkWithSeededSupplies()
    {
        var response = await _client.GetAsync("/api/supplies");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var items = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        Assert.NotNull(items);
        Assert.NotEmpty(items);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WithCorrectData()
    {
        // Need a location id — get the first one
        var locResp = await _client.GetAsync("/api/locations");
        locResp.EnsureSuccessStatusCode();
        var locations = await locResp.Content.ReadFromJsonAsync<List<Dictionary<string, object>>>();
        Assert.NotNull(locations);
        Assert.NotEmpty(locations);
        var locationId = locations![0]["id"].ToString();

        var request = new
        {
            name = "Test Water 1L",
            category = SupplyCategory.Water.ToString(),
            quantity = 5,
            unit = "L",
            storageLocationId = locationId,
            expiryDate = (string?)null,
            estimatedPricePerUnit = (decimal?)null
        };

        var response = await _client.PostAsJsonAsync("/api/supplies", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(created);
        Assert.Equal("Test Water 1L", created!["name"].ToString());
    }

    [Fact]
    public async Task Create_Then_Delete_Returns204()
    {
        var locResp = await _client.GetAsync("/api/locations");
        var locations = await locResp.Content.ReadFromJsonAsync<List<Dictionary<string, object>>>();
        var locationId = locations![0]["id"].ToString();

        var createResp = await _client.PostAsJsonAsync("/api/supplies", new
        {
            name = "Temp Supply to Delete",
            category = SupplyCategory.Tools.ToString(),
            quantity = 1,
            unit = "szt",
            storageLocationId = locationId,
            expiryDate = (string?)null,
            estimatedPricePerUnit = (decimal?)null
        });
        createResp.EnsureSuccessStatusCode();
        var created = await createResp.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = created!["id"].ToString();

        var deleteResp = await _client.DeleteAsync($"/api/supplies/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        var getResp = await _client.GetAsync($"/api/supplies/{id}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }
}
