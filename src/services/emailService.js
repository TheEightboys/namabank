// Email service using Brevo (Sendinblue) API
// Configured for Namavruksha notifications

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'yogiramsuratkumarbhajans@gmail.com';
const SENDER_NAME = 'Namavruksha';

export const sendNotificationEmail = async ({ to, subject, message }) => {
    try {
        const response = await fetch(BREVO_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: SENDER_NAME,
                    email: SENDER_EMAIL
                },
                to: [
                    {
                        email: to,
                        name: to.split('@')[0]
                    }
                ],
                subject: subject,
                textContent: message,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #FF9933 0%, #8B4513 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">🙏 Namavruksha</h1>
                            <p style="color: #fff8e1; margin: 5px 0 0 0;">The Divine Tree of the Holy Name</p>
                        </div>
                        <div style="background: #fdf8f3; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #e8ddd4;">
                            <h2 style="color: #8B4513; margin-top: 0;">${subject}</h2>
                            <div style="white-space: pre-line; color: #333; line-height: 1.6;">${message}</div>
                            <hr style="border: none; border-top: 1px solid #e8ddd4; margin: 20px 0;">
                            <p style="color: #888; font-size: 12px; text-align: center;">
                                Yogi Ramsuratkumar Jaya Guru Raya!<br>
                                <a href="https://namavruksha.org" style="color: #FF9933;">namavruksha.org</a>
                            </p>
                        </div>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Brevo API Error:', errorData);
            throw new Error(errorData.message || 'Failed to send email');
        }

        const result = await response.json();
        console.log('Email sent successfully:', result);
        return { status: 200, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        // Don't throw - just log and return error status
        // This prevents registration from failing due to email issues
        return { status: 500, error: error.message };
    }
};

// Helper function to send registration notification to admin
export const sendNewRegistrationNotification = async (userData) => {
    const subject = '🌱 New Sankalpa Registration - Namavruksha';
    const message = `A new devotee has joined Sankalpa!

📋 Registration Details:
━━━━━━━━━━━━━━━━━━━━━━
Name: ${userData.name}
Email: ${userData.email}
WhatsApp: ${userData.whatsapp || 'Not provided'}
City: ${userData.city || 'Not provided'}
State: ${userData.state || 'Not provided'}
Country: ${userData.country || 'Not provided'}
━━━━━━━━━━━━━━━━━━━━━━

Registered on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

Hari Om 🙏`;

    return sendNotificationEmail({
        to: 'yogiramsuratkumarbhajans@gmail.com',
        subject,
        message
    });
};

// Helper function to send feedback notification to admin
export const sendFeedbackNotification = async (feedbackData) => {
    const typeLabels = {
        sankalpa_suggestion: '🌱 New Sankalpa Request',
        feedback: '💬 General Feedback',
        bug_report: '🐛 Bug Report / Issue'
    };
    
    const typeLabel = typeLabels[feedbackData.type] || '📩 Feedback';
    const subject = `${typeLabel} - Namavruksha`;
    const message = `${typeLabel} received from a devotee:

📋 Details:
━━━━━━━━━━━━━━━━━━━━━━
Type: ${typeLabel}
Subject: ${feedbackData.subject}
Message: ${feedbackData.message}
━━━━━━━━━━━━━━━━━━━━━━

👤 User Information:
Name: ${feedbackData.userName || 'Anonymous'}
Contact: ${feedbackData.userContact || 'Not provided'}

Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

Hari Om 🙏`;

    return sendNotificationEmail({
        to: 'yogiramsuratkumarbhajans@gmail.com',
        subject,
        message
    });
};
