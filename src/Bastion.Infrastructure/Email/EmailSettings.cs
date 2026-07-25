namespace Bastion.Infrastructure.Email;

public class EmailSettings
{
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 1025;
    public string From { get; init; } = "bastion@localhost";
    public string To { get; init; } = "household@localhost";
}
