// kafka-gateway/server.js
const express = require('express');
const { Kafka } = require('kafkajs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001; // Different port for gateway

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // React app URL
  credentials: true
}));
app.use(express.json());

// Kafka configuration
const kafka = Kafka({
  clientId: 'auth-gateway',
  brokers: ['localhost:9092'], // Default Kafka broker
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'auth-gateway-group' });

// Store pending requests with correlation IDs
const pendingRequests = new Map();

// Initialize Kafka
async function initKafka() {
  try {
    await producer.connect();
    await consumer.connect();
    
    // Subscribe to response topics
    await consumer.subscribe({ topic: 'auth-responses' });
    
    // Handle responses from auth service
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const response = JSON.parse(message.value.toString());
        const correlationId = response.correlationId;
        
        if (pendingRequests.has(correlationId)) {
          const { res } = pendingRequests.get(correlationId);
          res.json(response.data);
          pendingRequests.delete(correlationId);
        }
      },
    });
    
    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Kafka initialization failed:', error);
  }
}

// Generic route handler for auth requests
async function handleAuthRequest(req, res, action) {
  const correlationId = uuidv4();
  const timeout = 30000; // 30 seconds timeout
  
  // Store the response object with correlation ID
  pendingRequests.set(correlationId, { res });
  
  // Set timeout to clean up pending requests
  setTimeout(() => {
    if (pendingRequests.has(correlationId)) {
      pendingRequests.delete(correlationId);
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }
  }, timeout);
  
  try {
    // Send message to Kafka
    await producer.send({
      topic: 'auth-requests',
      messages: [
        {
          key: action,
          value: JSON.stringify({
            correlationId,
            action,
            data: req.body,
            timestamp: Date.now()
          }),
        },
      ],
    });
  } catch (error) {
    pendingRequests.delete(correlationId);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

// Routes
app.post('/register', async (req, res) => {
  await handleAuthRequest(req, res, 'register');
});

app.post('/login', async (req, res) => {
  await handleAuthRequest(req, res, 'login');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

// Start server
app.listen(port, async () => {
  console.log(`Kafka Gateway running on http://localhost:${port}`);
  await initKafka();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gateway...');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});