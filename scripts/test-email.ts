import "dotenv/config";
import { Resend } from "resend";

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'KIZERE Inc <kizereinc@gmail.com>';
  
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  
  const resend = new Resend(apiKey);
  
  console.log(`Sending from onboarding@resend.dev...`);
  const response = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "businessinrwanda1@gmail.com",
    subject: "Test KIZERE Email",
    text: "This is a test email.",
  });
  
  console.log("Response:", JSON.stringify(response, null, 2));
}

testEmail();