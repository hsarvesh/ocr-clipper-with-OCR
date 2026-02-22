const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    try {
        const { amount, credits } = req.body;

        // Verify user is authenticated
        const auth = req.headers.authorization;
        if (!auth) {
            throw new Error('Not authenticated');
        }

        const token = auth.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                userId,
                credits
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook to handle successful payments
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { userId, credits } = paymentIntent.metadata;

            // Add credits to user's account
            const userRef = admin.firestore().collection('users').doc(userId);
            await admin.firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const currentCredits = userDoc.exists ? userDoc.data().credits || 0 : 0;

                transaction.set(userRef, {
                    credits: currentCredits + parseInt(credits)
                }, { merge: true });

                // Record the transaction
                const transactionRef = admin.firestore().collection('transactions').doc();
                transaction.set(transactionRef, {
                    userId,
                    type: 'purchase',
                    amount: paymentIntent.amount / 100,
                    credits: parseInt(credits),
                    paymentId: paymentIntent.id,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    description: `Purchased ${credits} credits`
                });
            });
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
