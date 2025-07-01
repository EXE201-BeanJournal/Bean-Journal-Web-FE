# Email Functionality Setup with Resend.com

This guide explains how to set up the email functionality in the Bean Journal support widget using Resend.com.

## Overview

The email functionality has been enhanced to use [Resend.com](https://resend.com/) for sending support emails instead of relying on mailto links. This provides a better user experience and more reliable email delivery.

## Features

- ✅ Professional email form with validation
- ✅ Automatic fallback to mailto if Resend is not configured
- ✅ Rich HTML email templates
- ✅ Form validation and error handling
- ✅ Success/error status messages
- ✅ Resend functionality

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com/](https://resend.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Bean Journal Support")
5. Copy the generated API key

### 3. Configure Your Domain (Optional but Recommended)

1. In the Resend dashboard, go to "Domains"
2. Add your domain (e.g., `beanjournal.site`)
3. Follow the DNS verification steps
4. Once verified, you can send emails from `support@yourdomain.com`

### 4. Set Up Environment Variables

1. Copy `.env.example` to `.env` in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Resend API key:
   ```env
   VITE_RESEND_API_KEY=re_your_actual_api_key_here
   ```

### 5. Update Email Configuration

In `src/services/emailService.ts`, update the `from` email address to match your verified domain:

```typescript
from: 'Bean Journal Support <support@yourdomain.com>',
to: ['support@yourdomain.com'], // Your support email
```

## How It Works

### Email Form Component

The `EmailForm` component (`src/components/BeanJournalWidget/EmailForm.tsx`) provides:

- Name, email, subject, and message fields
- Form validation
- Submit and resend functionality
- Status messages
- Professional styling

### Email Service

The `emailService` (`src/services/emailService.ts`) handles:

- Resend API integration
- HTML email template generation
- Fallback to mailto if Resend fails
- Email validation
- Error handling

### Fallback Behavior

If Resend is not configured or fails:

1. The system automatically falls back to opening the user's default email client
2. A pre-filled mailto link is generated with the form data
3. Users can still send emails through their email client

## Email Template

Emails sent through Resend include:

- Professional HTML formatting
- User information (name, email)
- Message content with proper formatting
- Timestamp
- Reply-to address set to user's email

## Security Considerations

⚠️ **Important**: In a production environment, the Resend API key should be handled on the backend, not exposed in the frontend environment variables. Consider:

1. Creating a backend API endpoint for email sending
2. Storing the API key securely on the server
3. Making requests from the frontend to your backend API

## Troubleshooting

### Common Issues

1. **"Resend API key not configured" message**
   - Check that your `.env` file exists and contains the correct API key
   - Restart your development server after adding environment variables

2. **Email not sending**
   - Verify your API key is correct
   - Check that your domain is verified in Resend (if using custom domain)
   - Check browser console for error messages

3. **"From" email address issues**
   - Make sure the "from" address uses a verified domain
   - For testing, you can use `onboarding@resend.dev`

### Testing

To test the email functionality:

1. Fill out the email form in the support widget
2. Check your email inbox for the message
3. Verify the email formatting and content
4. Test the fallback by temporarily removing the API key

## API Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month

For higher volumes, consider upgrading to a paid plan.

## Support

If you encounter issues with the email setup:

1. Check the browser console for error messages
2. Verify your Resend configuration
3. Test with the fallback mailto functionality
4. Refer to [Resend documentation](https://resend.com/docs)