import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
export const resend = new Resend(process.env.RESEND_API_KEY || '');

interface SendEmailParams {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailParams) => {
    try {
        // Fallback for development if no API key is provided
        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY is not set. Simulating email sending:');
            console.log(`[Email to ${to}]: ${subject}\n${text}`);
            return true;
        }

        // Send email via Resend
        // Note: onboarding@resend.dev is a testing domain provided by Resend
        const data = await resend.emails.send({
            from: 'Team Task Manager <onboarding@resend.dev>', 
            to,
            subject,
            text,
            html,
        });
        
        return data;
    } catch (error) {
        console.error('Failed to send email via Resend:', error);
        throw error;
    }
}
