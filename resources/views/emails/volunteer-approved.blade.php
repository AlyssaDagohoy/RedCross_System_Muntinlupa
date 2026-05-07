<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Account Approved</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .header { background: #DC2626; padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #111; font-size: 22px; margin: 0 0 16px; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .badge { display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
        .btn { display: inline-block; background: #DC2626; color: white; padding: 13px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0 24px; }
        .info-box { background: #fafafa; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .info-box p { margin: 0; font-size: 13px; color: #666; }
        .info-box strong { color: #111; }
        .footer { background: #111; padding: 24px 32px; text-align: center; }
        .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>✚ Philippine Red Cross</h1>
            <p>Muntinlupa City Branch</p>
        </div>

        <!-- Body -->
        <div class="body">
            <div class="badge">✓ Account Approved</div>

            <h2>Welcome, {{ $volunteer->name }}!</h2>

            <p>We are pleased to inform you that your volunteer account with the <strong>Philippine Red Cross – Muntinlupa City Branch</strong> has been <strong>approved</strong> by our administrator.</p>

            <p>You can now log in to the Volunteer Portal to access your dashboard, view activities, and manage your attendance.</p>

            <a href="{{ url('/login') }}" class="btn">Log In to Volunteer Portal →</a>

            <div class="info-box">
                <p><strong>Your registered email:</strong> {{ $volunteer->email }}</p>
                <p style="margin-top: 8px;"><strong>Status:</strong> <span style="color: #16a34a;">Approved ✓</span></p>
            </div>

            <p>If you have any questions, please contact the Red Cross Muntinlupa admin team.</p>

            <p style="color: #999; font-size: 13px;">If you did not register for this account, please ignore this email.</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>© 2026 Philippine Red Cross – Muntinlupa City Branch. All rights reserved.</p>
        </div>
    </div>
</body>
</html>