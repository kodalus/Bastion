using Bastion.Application.Dashboard;
using Bastion.Application.Notifications;
using Bastion.Application.Supplies;
using Bastion.Domain.Aggregates.Notifications;
using Microsoft.Extensions.Logging;
using Quartz;

namespace Bastion.Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class ExpiryScanJob(
    IHouseholdRepository householdRepo,
    ISupplyRepository supplyRepo,
    INotificationRepository notificationRepo,
    ILogger<ExpiryScanJob> logger) : IJob
{
    private const int WarnDays = 30;

    public async Task Execute(IJobExecutionContext context)
    {
        var ct = context.CancellationToken;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var household = await householdRepo.GetFirstAsync(ct);
        if (household is null) return;

        if (await notificationRepo.ExistsForDateAsync(household.Id, NotificationType.ExpiryAlert, today, ct))
        {
            logger.LogDebug("Expiry alert already created for {Date}", today);
            return;
        }

        var items = await supplyRepo.GetAllAsync(ct);
        var expiring = items
            .Where(i => i.ExpiryDate.HasValue && !i.IsExpired(today) && i.IsExpiringSoon(today, WarnDays))
            .OrderBy(i => i.ExpiryDate)
            .ToList();

        if (expiring.Count == 0)
        {
            logger.LogDebug("No expiring supplies on {Date}", today);
            return;
        }

        var rows = string.Join("", expiring.Select(i =>
            $"<tr><td>{i.Name}</td><td>{i.Category}</td><td>{i.ExpiryDate:yyyy-MM-dd}</td><td>{(int)(i.ExpiryDate!.Value.DayNumber - today.DayNumber)} dni</td></tr>"));

        var body = $"""
            <h2>Zapasy bliskie wygaśnięcia</h2>
            <table border="1" cellpadding="6" cellspacing="0">
              <tr><th>Nazwa</th><th>Kategoria</th><th>Wygasa</th><th>Pozostało</th></tr>
              {rows}
            </table>
            <p>Sprawdź zapasy i uzupełnij zgodnie z zasadą FIFO.</p>
            """;

        var notification = Notification.Create(
            household.Id, NotificationType.ExpiryAlert,
            $"[Bastion] {expiring.Count} zapasów wygasa w ciągu {WarnDays} dni",
            body, today);

        await notificationRepo.AddAsync(notification, ct);
        logger.LogInformation("Created expiry alert for {Count} items on {Date}", expiring.Count, today);
    }
}
