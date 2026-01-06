// Simple email sending service using EmailJS (client-side)
// You must configure EmailJS in your project and set up a template for notifications
// See: https://www.emailjs.com/docs/examples/reactjs/

// NOTE: emailjs-com is deprecated, but still works. For latest, use '@emailjs/browser'.
import emailjs from 'emailjs-com';

const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const USER_ID = 'your_user_id';

export const sendNotificationEmail = async ({ to, subject, message }) => {
  if (SERVICE_ID === 'your_service_id') {
    console.log('EMAIL SIMULATION (Configure EmailJS to send real emails):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    return { status: 200, text: 'Simulated' };
  }

  const templateParams = {
    to_email: to,
    subject,
    message,
  };
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
};
