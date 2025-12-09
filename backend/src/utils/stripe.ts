import Stripe from 'stripe';

// Stripe is optional - if not configured, bookings will work without payment
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null;

// Log Stripe status at startup
if (stripe) {
  console.log('✓ Stripe payment integration enabled');
} else {
  console.log('⚠ Stripe not configured - bookings will work without payment');
}

export default stripe;

/**
 * Check if Stripe is enabled
 */
export const isStripeEnabled = (): boolean => {
  return stripe !== null;
};

/**
 * Create a Stripe customer
 */
export const createCustomer = async (email: string, name: string) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.customers.create({
    email,
    name,
  });
};

/**
 * Create a subscription
 */
export const createSubscription = async (
  customerId: string,
  priceId: string
) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
};

/**
 * Create a payment intent for one-time payments
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

/**
 * Retrieve a payment intent
 */
export const retrievePaymentIntent = async (paymentIntentId: string) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (subscriptionId: string) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.cancel(subscriptionId);
};

/**
 * Retrieve a subscription
 */
export const retrieveSubscription = async (subscriptionId: string) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.retrieve(subscriptionId);
};
