<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
    <meta charset="UTF-8">
    <title>New Event Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #462f7d;
            color: white;
            padding: 24px;
            text-align: center;
        }
        .content {
            padding: 24px;
            color: #333;
        }
        .content h2 {
            margin-top: 0;
            color: #111827;
        }
        .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #462f7d;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            padding: 16px;
            font-size: 12px;
            color: #6b7280;
            background-color: #f9fafb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 New Event Just Announced!</h1>
        </div>
        <div class="content">
            <h2>{{ $event->title }}</h2>
            <p>{{ $event->description }}</p>

            <p><strong>Category:</strong> {{ $event->category->name }}</p>
            <p><strong>Duration:</strong> {{ $event->duration }}</p>

            <a href="http://127.0.0.1:8080/events/details/?event={{ $event->id }}" class="cta-button">View Event</a>
        </div>
        <div class="footer">
            You're receiving this email because you subscribed to our newsletter.<br>
            Eventix © {{ date('Y') }}. All rights reserved.
        </div>
    </div>
</body>
</html>
