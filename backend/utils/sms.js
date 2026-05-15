let twilioClient = null;

function getClient() {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured.');
    }
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Send an SMS message via Twilio
 */
exports.sendSMS = async (to, body) => {
  const client = getClient();
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE,
    to,
  });
};
