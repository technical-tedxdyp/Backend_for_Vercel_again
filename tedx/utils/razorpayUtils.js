const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.TEDX_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.TEDX_RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    '⚠️ Razorpay keys are missing. Please set TEDX_RAZORPAY_KEY_ID and TEDX_RAZORPAY_KEY_SECRET in environment variables.'
  );
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

const createOrder = async (amount) => {
  const options = {
    amount, // Amount in paise, ensure it is number
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error.stack);
    throw error;
  }
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === razorpaySignature;
};

module.exports = { createOrder, verifyPayment };
