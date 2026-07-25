using Bastion.Application.Notifications;
using Bastion.Infrastructure.Email;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Quartz;

namespace Bastion.Infrastructure.Jobs;

[DisallowConcurrentExecution]
public class NotificationDispatchJob(
    INotificationRepository notificationRepo,
    IEmailService emailService,
    IOptions<EmailSettings> emailOptions,
    ILogger<NotificationDispatchJob> logger) : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        var ct = context.CancellationToken;
        var pending = await notificationRepo.GetPendingAsync(ct);

        if (pending.Count == 0)
        {
            logger.LogDebug("No pending notifications to dispatch");
            return;
        }

        var to = emailOptions.Value.To;
        var sentCount = 0;

        foreach (var notification in pending)
        {
            try
            {
                await emailService.SendAsync(to, notification.Subject, notification.Body, ct);
                notification.MarkSent(DateTime.UtcNow);
                sentCount++;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send notification {Id}, will retry next run", notification.Id);
            }
        }

        if (sentCount > 0)
            await notificationRepo.SaveAsync(ct);

        logger.LogInformation("Dispatched {Sent}/{Total} notifications", sentCount, pending.Count);
    }
}
