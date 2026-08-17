const axios = require('axios');

const hasCredentials = !!(
  process.env.MPESA_CONSUMER_KEY &&
  process.env.MPESA_CONSUMER_SECRET &&
  process.env.MPESA_SHORTCODE &&
  process.env.MPESA_PASSKEY
);

/**
 * Initiates an STK push to the given phone number.
 * Falls back to a mock response (with a fake mpesaRef) if no Daraja
 * credentials are configured in .env, so the app is fully usable in dev.
 */
async function stkPush({ phone, amount, accountReference, transactionDesc }) {
  if (!hasCredentials) {
    // MOCK MODE — no real Daraja credentials configured
    const mockRef = `MOCK${Date.now().toString().slice(-8)}`;
    console.log(`[MPESA MOCK] STK push simulated for ${phone}, KES ${amount}, ref ${mockRef}`);
    return {
      mocked: true,
      merchantRequestId: `mock-merchant-${Date.now()}`,
      checkoutRequestId: `mock-checkout-${Date.now()}`,
      mpesaRef: mockRef,
      responseDescription: 'Success. Request accepted for processing (MOCKED)',
    };
  }

  // REAL MODE — talk to Safaricom Daraja API
  const authResp = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      auth: {
        username: process.env.MPESA_CONSUMER_KEY,
        password: process.env.MPESA_CONSUMER_SECRET,
      },
    }
  );
  const accessToken = authResp.data.access_token;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const resp = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return {
    mocked: false,
    merchantRequestId: resp.data.MerchantRequestID,
    checkoutRequestId: resp.data.CheckoutRequestID,
    responseDescription: resp.data.ResponseDescription,
  };
}

module.exports = { stkPush, hasCredentials };
