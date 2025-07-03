// Email service using Vite proxy to bypass CORS
// The proxy is configured in vite.config.ts to forward requests to Resend API

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
}

export const sendSupportEmail = async (emailData: EmailData): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.message) {
      return {
        success: false,
        message: 'Missing required fields: to, subject, and message are required'
      };
    }

    // Check if API key is configured
    if (!import.meta.env.VITE_RESEND_API_KEY) {
      console.warn('Resend API key not configured, falling back to mailto');
      // Fallback to mailto link
      const mailtoUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.message)}`;
      window.open(mailtoUrl, '_blank');
      return {
        success: true,
        message: 'Email client opened successfully'
      };
    }

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Bean Journal Support Request
        </h2>
        
        ${emailData.userName ? `<p><strong>From:</strong> ${emailData.userName}</p>` : ''}
        ${emailData.userEmail ? `<p><strong>Email:</strong> ${emailData.userEmail}</p>` : ''}
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Message:</h3>
          <p style="line-height: 1.6; color: #212529;">${emailData.message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #6c757d; font-size: 12px;">
          This email was sent from the Bean Journal support widget.
          <br>
          Timestamp: ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    // Send email directly to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Bean Journal Support <support@beanjournal.site>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailContent,
        reply_to: emailData.userEmail || 'noreply@beanjournal.site'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Resend API error:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to send email'}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return {
      success: true,
      message: 'Email sent successfully!'
    };

  } catch (error) {
    console.error('Email service error:', error);
    
    // Fallback to mailto if Resend fails
    const mailtoUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.message)}`;
    window.open(mailtoUrl, '_blank');
    
    return {
      success: true,
      message: 'Email service unavailable, opened email client instead'
    };
  }
};

// Helper function to create support email content
export const createSupportEmailContent = (userMessage: string, userInfo?: { name?: string; email?: string }) => {
  const timestamp = new Date().toLocaleString();
  let content = `Support Request from Bean Journal\n\n`;
  
  if (userInfo?.name) {
    content += `Name: ${userInfo.name}\n`;
  }
  
  if (userInfo?.email) {
    content += `Email: ${userInfo.email}\n`;
  }
  
  content += `\nMessage:\n${userMessage}\n\n`;
  content += `Sent at: ${timestamp}\n`;
  content += `From: Bean Journal Support Widget`;
  
  return content;
};

// Helper function to validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};