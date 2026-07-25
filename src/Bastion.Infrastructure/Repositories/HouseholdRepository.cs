using Bastion.Application.Dashboard;
using Bastion.Domain.Aggregates.Households;
using Bastion.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bastion.Infrastructure.Repositories;

public class HouseholdRepository(AppDbContext db) : IHouseholdRepository
{
    public async Task<Household?> GetFirstAsync(CancellationToken ct = default) =>
        await db.Households
            .Include(h => h.Members)
            .FirstOrDefaultAsync(ct);
}
