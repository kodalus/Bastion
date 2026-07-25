using Bastion.Domain.Common;

namespace Bastion.Domain.Aggregates.Notifications;

public enum NotificationType { ExpiryAlert, MaintenanceDue }

public class Notification : Entity
{
    public Guid HouseholdId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public DateOnly ScheduledFor { get; private set; }
    public DateTime? SentAt { get; private set; }
    public bool IsSent => SentAt.HasValue;

    private Notification() { }

    public static Notification Create(
        Guid householdId,
        NotificationType type,
        string subject,
        string body,
        DateOnly scheduledFor) =>
        new()
        {
            HouseholdId = householdId,
            Type = type,
            Subject = subject,
            Body = body,
            ScheduledFor = scheduledFor,
        };

    public void MarkSent(DateTime sentAt)
    {
        SentAt = sentAt;
        MarkUpdated();
    }
}
