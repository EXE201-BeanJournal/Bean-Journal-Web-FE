# Production Email Deployment Guide

This guide explains how to deploy the email functionality to work in production, where the Vite development proxy is not available.

## Architecture Overview

The email system uses different approaches for development and production:

- **Development**: Uses Vite proxy to forward requests to Resend API directly
- **Production**: Uses a separate backend server (bean-journal-admin) to handle email sending

## Deployment Steps

### 1. Deploy the Backend Server (bean-journal-admin)

The backend server contains the `/api/email/send` endpoint that handles email sending in production.

#### Backend Environment Variables

Ensure your backend server has these environment variables configured:

```env
# Email Service Configuration
EMAIL_SERVICE_URL=https://api.resend.com
EMAIL_SERVICE_KEY=re_your_resend_api_key
EMAIL_FROM_ADDRESS=support@beanjournal.site
EMAIL_FROM_NAME=Bean Journal Support

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Deploy Backend Server

1. **Option A: Traditional Server Deployment**
   ```bash
   cd bean-journal-admin
   npm install
   npm run build
   npm start
   ```

2. **Option B: Docker Deployment**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

3. **Option C: Serverless Deployment**
   - Deploy to Vercel, Netlify Functions, or AWS Lambda
   - Ensure the `/api/email/send` endpoint is accessible

### 2. Configure Frontend Environment Variables

Update your frontend production environment variables:

```env
# Backend API Configuration
VITE_BACKEND_API_URL=https://your-backend-domain.com

# Optional: Keep Resend key for development fallback
VITE_RESEND_API_KEY=re_your_resend_api_key
```

### 3. Deploy Frontend

Deploy your frontend as usual. The email service will automatically:
- Use Vite proxy in development
- Use backend API in production
- Fall back to mailto if backend is unavailable

## API Endpoint Details

### Backend API Endpoint: `POST /api/email/send`

**Request Body:**
```json
{
  "to_address": "recipient@example.com",
  "subject": "Email Subject",
  "body_html": "<p>HTML email content</p>",
  "reply_to_email_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "message_id": "unique_message_id"
}
```

## Alternative Deployment Options

### Option 1: Serverless Functions

If you prefer not to run a separate backend server, you can deploy the email endpoint as serverless functions:

#### Vercel Functions

Create `api/email/send.ts` in your frontend project:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to_address, subject, body_html } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bean Journal Support <support@beanjournal.site>',
        to: [to_address],
        subject,
        html: body_html,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    res.json({ success: true, message_id: result.id });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
```

#### Netlify Functions

Create `netlify/functions/send-email.ts`:

```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  const { to_address, subject, body_html } = JSON.parse(event.body || '{}');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bean Journal Support <support@beanjournal.site>',
        to: [to_address],
        subject,
        html: body_html,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message_id: result.id })
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      })
    };
  }
};
```

Then update your frontend environment variable:
```env
VITE_BACKEND_API_URL=https://your-site.netlify.app/.netlify/functions
```

### Option 2: Cloudflare Workers

Deploy a Cloudflare Worker to handle email sending:

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { to_address, subject, body_html } = await request.json();

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bean Journal Support <support@beanjournal.site>',
          to: [to_address],
          subject,
          html: body_html,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email');
      }

      return Response.json({ success: true, message_id: result.id });
    } catch (error) {
      console.error('Email sending error:', error);
      return Response.json({ 
        success: false, 
        message: error.message || 'Unknown error' 
      }, { status: 500 });
    }
  }
};
```

## Testing

### Development Testing
```bash
cd bean-journal
npm run dev
# Email service will use Vite proxy
```

### Production Testing
```bash
cd bean-journal
npm run build
npm run preview
# Email service will use backend API
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your backend server has CORS configured for your frontend domain
   - Add your frontend URL to the CORS_ORIGIN environment variable

2. **Backend API Not Found**
   - Verify VITE_BACKEND_API_URL is correctly set
   - Check that the backend server is running and accessible
   - Test the API endpoint directly: `curl -X POST https://your-backend/api/email/send`

3. **Email Not Sending**
   - Verify Resend API key is valid
   - Check email service quotas and limits
   - Review backend server logs for errors

4. **Environment Variables Not Loading**
   - Ensure .env file is in the correct location
   - Restart the development server after changing environment variables
   - For production, set environment variables in your hosting platform

### Fallback Behavior

The email service includes multiple fallback mechanisms:
1. If backend API is unavailable → falls back to mailto
2. If Resend API fails → falls back to mailto
3. If no configuration is found → falls back to mailto

This ensures users can always send support emails, even if the automated system fails.

## Security Considerations

1. **API Key Security**
   - Never expose Resend API keys in frontend code
   - Use environment variables on the backend server
   - Rotate API keys regularly

2. **CORS Configuration**
   - Restrict CORS to your specific frontend domain
   - Don't use wildcard (*) in production

3. **Rate Limiting**
   - Implement rate limiting on your backend API
   - Monitor email sending quotas

4. **Input Validation**
   - Validate email addresses and content on the backend
   - Sanitize HTML content to prevent XSS

By following this guide, your email functionality will work seamlessly in both development and production environments.