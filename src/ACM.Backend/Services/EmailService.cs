using System.Net;
using System.Net.Mail;
using ACM.Backend.Core.Interfaces;

namespace ACM.Backend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var host = _config["SmtpSettings:Host"];
            var portString = _config["SmtpSettings:Port"];
            var username = _config["SmtpSettings:Username"];
            var password = _config["SmtpSettings:Password"];
            var fromAddress = _config["SmtpSettings:FromEmail"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(portString) ||
                string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(fromAddress))
            {
                _logger.LogWarning("SMTP settings are incomplete. Skipping email sending.");
                return;
            }

            int port = int.Parse(portString);

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            using var message = new MailMessage(fromAddress, toEmail, subject, body);
            await client.SendMailAsync(message);
            _logger.LogInformation($"Email sent successfully to {toEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {toEmail}");
        }
    }
}
