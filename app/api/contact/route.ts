import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    // Basic email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const ownerEmail = process.env.CONTACT_RECEIVER_EMAIL;
    if (!ownerEmail) {
      return NextResponse.json({ error: 'Contact receiver email not configured.' }, { status: 500 });
    }

    // Email to site owner
    // TypeScript code for NodeMailer options
    const ownerMailOptions = {
      from: `"SEO Feedback" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `📝 New Feedback Submission from ${name}`,
      html: `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #4f46e5; padding: 16px;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px;">🚀 SEO Feedback Received</h2>
        </div>
        <div style="padding: 24px; color: #111827;">
          <p style="margin: 0 0 16px;">You have received new feedback via the SEO comparison tool:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: 600; color: #374151;">👤 Name:</td>
              <td style="padding: 8px; color: #4b5563;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: 600; color: #374151;">📧 Email:</td>
              <td style="padding: 8px; color: #4b5563;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: 600; color: #374151;">💬 Message:</td>
              <td style="padding: 8px; color: #4b5563;">${message}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
          This feedback was submitted from your SEO Checker platform.
        </div>
      </div>
    </div>
  `,
    };


    // Email to sender
    const senderMailOptions = {
      from: `SEO Checker <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Thank you for contacting SEO Checker',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 24px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);">
            <div style="background-color: #10b981; padding: 16px;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px;">🎉 Thank You, ${name}!</h2>
            </div>
            <div style="padding: 24px; color: #111827;">
              <p style="margin-bottom: 16px;">
                We’ve received your message and appreciate you reaching out to us.
              </p>
              <p style="margin-bottom: 16px;">
                Our team will review your feedback and respond as soon as possible. In the meantime, feel free to continue exploring the SEO Checker platform.
              </p>
              <p style="margin-bottom: 0;">Happy optimizing! 🚀</p>
            </div>
            <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
              — The SEO Checker Team<br/>
            </div>
          </div>
        </div>
      `,
    };



    // Send both emails
    await transporter.sendMail(ownerMailOptions);
    await transporter.sendMail(senderMailOptions);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
} 