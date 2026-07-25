using Bastion.Domain.Aggregates.Notifications;

namespace Bastion.Application.Notifications;

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> GetPendingAsync(CancellationToken ct = default);
    Task<bool> ExistsForDateAsync(Guid householdId, NotificationType type, DateOnly date, CancellationToken ct = default);
    Task AddAsync(Notification notification, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
