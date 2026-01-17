import { NextRequest, NextResponse } from 'next/server';

// Contact form API route
// Sends email via Resend or logs for development

// Simple in-memory rate limiting for contact form
const contactRateLimit = new Map<string, { count: number; resetAt: number }>();
const CONTACT_RATE_LIMIT = 5; // 5 requests per hour
const CONTACT_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = contactRateLimit.get(ip);
  
  if (!entry || entry.resetAt < now) {
    contactRateLimit.set(ip, { count: 1, resetAt: now + CONTACT_RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= CONTACT_RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// HTML entity encoding to prevent XSS
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || request.headers.get('x-real-ip') 
      || '0.0.0.0';
    
    if (!checkContactRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Length validation to prevent abuse
    if (name.length > 100 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Input too long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check for Resend API key (production)
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'h2cubed@live.com';
    // Use verified domain for production, or resend.dev for testing (only sends to account email)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Flock Contact <onboarding@resend.dev>';

    if (resendApiKey) {
      // Send via Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipientEmail,
          reply_to: email,
          subject: `[Flock Contact] ${subject}`,
          text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
          `.trim(),
          html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Name</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(subject)}</td>
    </tr>
  </table>
  <h3 style="color: #333;">Message:</h3>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${escapeHtml(message)}</div>
</div>
          `.trim(),
        }),
      });

      if (!response.ok) {
        console.error('Resend error:', await response.text());
        return NextResponse.json(
          { error: 'Failed to send message' },
          { status: 500 }
        );
      }
    } else {
      // Development: Log the message
      console.warn('=== CONTACT FORM SUBMISSION ===');
      console.warn(`To: ${recipientEmail}`);
      console.warn(`From: ${name} <${email}>`);
      console.warn(`Subject: ${subject}`);
      console.warn(`Message:\n${message}`);
      console.warn('===============================');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

