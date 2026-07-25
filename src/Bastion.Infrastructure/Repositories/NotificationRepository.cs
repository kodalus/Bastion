using Bastion.Application.Notifications;
using Bastion.Domain.Aggregates.Notifications;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class NotificationRepository(AppDbContext db) : INotificationRepository
{
    public async Task<IReadOnlyList<Notification>> GetPendingAsync(CancellationToken ct = default) =>
        await db.Notifications.Where(n => n.SentAt == null).OrderBy(n => n.CreatedAt).ToListAsync(ct);

    public async Task<bool> ExistsForDateAsync(Guid householdId, NotificationType type, DateOnly date, CancellationToken ct = default) =>
        await db.Notifications.AnyAsync(n => n.HouseholdId == householdId && n.Type == type && n.ScheduledFor == date, ct);

    public async Task AddAsync(Notification notification, CancellationToken ct = default)
    {
        await db.Notifications.AddAsync(notification, ct);
        await db.SaveChangesAsync(ct);
    }

    public Task SaveAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
