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
      console.error('Resend API key not configured');
      return {
        success: false,
        message: 'Email service not configured. Please contact support directly.'
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

    // Send email using Vite proxy to Resend API
    const response = await fetch('/api/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      let errorMessage = 'Failed to send email';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.error('Failed to parse error response:', textError);
        }
      }
      console.error('Resend API error:', errorMessage);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse success response as JSON:', parseError);
      // If response is not JSON, treat as success if status is ok
      result = { message: 'Email sent successfully (non-JSON response)' };
    }
    console.log('Email sent successfully:', result);

    return {
      success: true,
      message: 'Email sent successfully!'
    };

  } catch (error) {
    console.error('Email service error:', error);
    
    return {
      success: false,
      message: 'Failed to send email. Please try again or contact support directly.'
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