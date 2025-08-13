<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>User query</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #6c2bd9;">This query is from, {{ $contact['name'] }}!</h2>
        <p>We have received your message and our support team will get back to you shortly.</p>

        <h3 style="margin-top: 30px;">The Query is:</h3>
        <ul>
            <li><strong>Email:</strong> {{ $contact['email'] }}</li>
            <li><strong>Phone:</strong> {{ $contact['country_code'] }} {{ $contact['phone'] }}</li>
            <li><strong>City:</strong> {{ $contact['city'] ?? 'N/A' }}</li>
            <li><strong>State:</strong> {{ $contact['state'] ?? 'N/A' }}</li>
            <li><strong>Description:</strong> {{ $contact['description'] }}</li>
        </ul>

        <p style="margin-top: 30px;">Best regards,<br>The Tick Here Support Team</p>
    </div>
</body>

</html>
