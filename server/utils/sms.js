const hasCredentials = !!(process.env.AT_USERNAME && process.env.AT_API_KEY);

let atClient = null;
if (hasCredentials) {
  // Lazy-load so the package is only required when real credentials exist.
  // npm i africastalking
  const AfricasTalking = require('africastalking');
  atClient = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  }).SMS;
}

/**
 * Sends an SMS notification. Falls back to console logging (mock mode)
 * when Africa's Talking credentials aren't configured.
 */
async function sendSMS(to, message) {
  if (!hasCredentials) {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return { mocked: true, to, message };
  }

  const result = await atClient.send({ to: [to], message });
  return { mocked: false, result };
}

module.exports = { sendSMS, hasCredentials };
