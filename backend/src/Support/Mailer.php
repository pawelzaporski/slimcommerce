<?php

declare(strict_types=1);

namespace App\Support;

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;
use Throwable;

/**
 * Wysyłka e-maili przez SMTP (PHPMailer). Na shared hostingu używaj skrzynki
 * SMTP założonej w panelu hostingu (MAIL_HOST/MAIL_USERNAME/...) - wysyłka
 * przez mail() z losowego hosta ląduje w spamie albo jest blokowana.
 *
 * MAIL_MAILER w .env:
 * - smtp - realna wysyłka,
 * - log  - nic nie wysyła, treść wiadomości trafia do logu błędów (dev),
 * - none - wyłączone.
 *
 * send() nigdy nie rzuca wyjątku: błąd wysyłki jest logowany i zwracany jako
 * false, żeby awaria SMTP nie wywracała np. złożenia zamówienia.
 */
final readonly class Mailer
{
    public function __construct(
        private string $mailer,
        private string $host,
        private int $port,
        private string $username,
        private string $password,
        private string $encryption,
        private string $fromAddress,
        private string $fromName,
    ) {
    }

    /**
     * @param array<string, mixed> $env
     */
    public static function fromEnv(array $env): self
    {
        $fromAddress = trim((string) ($env['MAIL_FROM_ADDRESS'] ?? ''));

        if ($fromAddress === '') {
            $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
            $fromAddress = 'noreply@' . preg_replace('/:\d+$/', '', $host);
        }

        return new self(
            mailer: strtolower(trim((string) ($env['MAIL_MAILER'] ?? 'log'))),
            host: trim((string) ($env['MAIL_HOST'] ?? '')),
            port: (int) ($env['MAIL_PORT'] ?? 587),
            username: (string) ($env['MAIL_USERNAME'] ?? ''),
            password: (string) ($env['MAIL_PASSWORD'] ?? ''),
            encryption: strtolower(trim((string) ($env['MAIL_ENCRYPTION'] ?? 'tls'))),
            fromAddress: $fromAddress,
            fromName: trim((string) ($env['MAIL_FROM_NAME'] ?? ($env['APP_NAME'] ?? 'slimCommerce'))),
        );
    }

    public function isEnabled(): bool
    {
        return $this->mailer !== 'none';
    }

    public function send(string $toEmail, string $toName, string $subject, string $text, ?string $html = null): bool
    {
        if ($this->mailer === 'none') {
            return false;
        }

        if ($this->mailer === 'log') {
            error_log(sprintf(
                "[mail:log] To: %s <%s>\nSubject: %s\n\n%s",
                $toName,
                $toEmail,
                $subject,
                $text,
            ));

            return true;
        }

        if ($this->mailer !== 'smtp') {
            error_log("[mail] Nieznana wartość MAIL_MAILER: {$this->mailer} (dozwolone: smtp, log, none).");

            return false;
        }

        if ($this->host === '') {
            error_log('[mail] MAIL_MAILER=smtp, ale MAIL_HOST jest pusty - wiadomość nie została wysłana.');

            return false;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->Port = $this->port;
            $mail->SMTPAuth = $this->username !== '';
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = match ($this->encryption) {
                'ssl', 'smtps' => PHPMailer::ENCRYPTION_SMTPS,
                'tls', 'starttls' => PHPMailer::ENCRYPTION_STARTTLS,
                default => '',
            };
            $mail->SMTPAutoTLS = $mail->SMTPSecure !== '';

            $mail->setFrom($this->fromAddress, $this->fromName);
            $mail->addAddress($toEmail, $toName);
            $mail->Subject = $subject;

            if ($html !== null) {
                $mail->isHTML(true);
                $mail->Body = $html;
                $mail->AltBody = $text;
            } else {
                $mail->Body = $text;
            }

            $mail->send();

            return true;
        } catch (MailException $e) {
            error_log("[mail] Błąd wysyłki do {$toEmail}: " . $e->getMessage());
        } catch (Throwable $e) {
            error_log("[mail] Nieoczekiwany błąd wysyłki do {$toEmail}: " . $e->getMessage());
        }

        return false;
    }
}
