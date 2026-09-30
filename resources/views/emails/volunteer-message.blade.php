<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">
            Message from {{ $senderName }} via Philippine Red Cross — Muntinlupa
        </p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">
            {{ $body }}
        </div>
        <p style="font-size: 11px; color: #aaa; margin-top: 24px;">
            This message was sent through the Red Cross Volunteer Management System.
        </p>
    </div>
</body>
</html>
