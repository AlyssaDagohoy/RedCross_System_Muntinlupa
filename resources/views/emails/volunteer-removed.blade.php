<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Account Removed</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .header { background: #111; padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 13px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #111; font-size: 22px; margin: 0 0 16px; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .badge { display: inline-block; background: #fef2f2; border: 1px solid #fecaca; color: #DC2626; padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
        .info-box { background: #fafafa; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .info-box p { margin: 0; font-size: 13px; color: #666; }
        .footer { background: #111; padding: 24px 32px; text-align: center; }
        .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>&#10010; Philippine Red Cross</h1>
            <p>Muntinlupa City Branch</p>
        </div>

        <div class="body">
            <div class="badge">Account Removed</div>

            <h2>Hello, {{ $volunteer->name }}</h2>

            <p>This is to let you know that your volunteer account with the <strong>Philippine Red Cross &ndash; Muntinlupa City Branch</strong> has been <strong>removed</strong> by an administrator.</p>

            <p>You can no longer log in to the volunteer portal with this email address.</p>

            <div class="info-box">
                <p><strong>Email:</strong> {{ $volunteer->email }}</p>
                <p style="margin-top: 8px;"><strong>Status:</strong> <span style="color: #DC2626;">Removed</span></p>
            </div>

            <p>If you believe this is a mistake, or you would like to volunteer with us again, please contact our admin team at the Muntinlupa City Branch office.</p>

            <p>Thank you for your service.</p>
        </div>

        <div class="footer">
            <p>&copy; 2026 Philippine Red Cross &ndash; Muntinlupa City Branch. All rights reserved.</p>
        </div>
    </div>
</body>
</html>