using Bastion.Application.Dashboard;
using Bastion.Application.Equipment;
using Bastion.Application.Notifications;
using Bastion.Domain.Aggregates.Notifications;
using Microsoft.Extensions.Logging;
using Quartz;

namespace Bastion.Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class MaintenanceDueJob(
    IHouseholdRepository householdRepo,
    IEquipmentRepository equipmentRepo,
    INotificationRepository notificationRepo,
    ILogger<MaintenanceDueJob> logger) : IJob
{
    private const int WarnDays = 14;

    public async Task Execute(IJobExecutionContext context)
    {
        var ct = context.CancellationToken;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var household = await householdRepo.GetFirstAsync(ct);
        if (household is null) return;

        if (await notificationRepo.ExistsForDateAsync(household.Id, NotificationType.MaintenanceDue, today, ct))
        {
            logger.LogDebug("Maintenance alert already created for {Date}", today);
            return;
        }

        var allEquipment = await equipmentRepo.GetByHouseholdAsync(household.Id, ct);
        var dueTasks = allEquipment
            .SelectMany(e => e.Tasks
                .Where(t => t.IsOverdue(today) || t.IsDueSoon(today, WarnDays))
                .Select(t => (Equipment: e, Task: t)))
            .OrderBy(x => x.Task.NextDueAt)
            .ToList();

        if (dueTasks.Count == 0)
        {
            logger.LogDebug("No maintenance due on {Date}", today);
            return;
        }

        var rows = string.Join("", dueTasks.Select(x =>
        {
            var due = x.Task.NextDueAt!.Value;
            var status = x.Task.IsOverdue(today)
                ? $"<span style='color:red'>PRZETERMINOWANE ({today.DayNumber - due.DayNumber} dni)</span>"
                : $"Za {due.DayNumber - today.DayNumber} dni";
            return $"<tr><td>{x.Equipment.Name}</td><td>{x.Task.Description}</td><td>{due:yyyy-MM-dd}</td><td>{status}</td></tr>";
        }));

        var body = $"""
            <h2>Zadania konserwacyjne wymagające uwagi</h2>
            <table border="1" cellpadding="6" cellspacing="0">
              <tr><th>Sprzęt</th><th>Zadanie</th><th>Termin</th><th>Status</th></tr>
              {rows}
            </table>
            <p>Zaloguj się do Bastion, aby oznaczyć zadania jako wykonane.</p>
            """;

        var notification = Notification.Create(
            household.Id, NotificationType.MaintenanceDue,
            $"[Bastion] {dueTasks.Count} zadań konserwacyjnych wymaga uwagi",
            body, today);

        await notificationRepo.AddAsync(notification, ct);
        logger.LogInformation("Created maintenance alert for {Count} tasks on {Date}", dueTasks.Count, today);
    }
}
