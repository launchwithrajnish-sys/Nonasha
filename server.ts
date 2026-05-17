import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const app = express();

app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  systemInstruction: "You are the Nonasha Wellness Assistant, an expert in Ayurveda and addiction recovery. Provide empathetic, scientifically-grounded, and traditional Ayurvedic advice. Focus on the benefits of Nonasha drops (Ayurvedic herbs like Brahmi, Giloy, Amla, Kalmegh). Always recommend consulting a doctor for severe cases."
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ reply: "I'm currently in demo mode without an AI key. How can I help you manually?" });
  }

  try {
    const chat = model.startChat({
      history: history.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Initialize Stripe lazily as per guidelines
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // In development, handle missing key gracefully for the user
      console.warn('STRIPE_SECRET_KEY is missing. Payment features will be simulated.');
      return null;
    }
    stripe = new Stripe(key);
  }
  return stripe;
};

// Mock Order Database
const orders: Record<string, any> = {};

// API: Create Payment Session
app.post('/api/create-checkout-session', async (req, res) => {
  const { items, customerEmail, shipping, paymentMethod } = req.body;
  const orderId = uuidv4().slice(0, 8).toUpperCase();
  
  // Handle Cash on Delivery
  if (paymentMethod === 'cod') {
    orders[orderId] = {
      id: orderId,
      status: 'Awaiting COD Confirmation',
      items,
      customerEmail,
      shipping,
      paymentMethod: 'cod',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
    };
    
    return res.json({ 
      success: true, 
      orderId,
      url: `/order-success?order_id=${orderId}` 
    });
  }

  const stripeClient = getStripe();
  
  if (!stripeClient) {
    // If no Stripe key, simulate a successful order creation for demo purposes
    orders[orderId] = {
      id: orderId,
      status: 'Processing',
      items,
      customerEmail,
      shipping,
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString()
    };
    
    return res.json({ 
      simulated: true, 
      orderId,
      url: `/order-success?order_id=${orderId}` 
    });
  }

  try {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['IN'],
      },
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            description: item.size || 'Ayurvedic Supplement',
          },
          unit_amount: item.price * 100, // Stripe expects amounts in cents/paisa
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.origin}/cart`,
      customer_email: customerEmail,
      metadata: { orderId }
    });

    orders[orderId] = {
      id: orderId,
      status: 'Awaiting Payment',
      items,
      createdAt: new Date(),
    };

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tracking
app.get('/api/track/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders[orderId];
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update status randomly if it was 'Processing' for demo
  const statuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  if (order.status === 'Processing') {
    const ageInMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
    if (ageInMinutes > 2) order.status = 'Shipped';
    if (ageInMinutes > 10) order.status = 'Out for Delivery';
  }

  res.json(order);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
