const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

class KafkaClient {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'cart-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'cart-service-group' });
  }

  async init() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      
      // Subscribe to cart-related topics
      await this.consumer.subscribe({ topic: 'cart-requests' });
      await this.consumer.subscribe({ topic: 'product-events' });
      await this.consumer.subscribe({ topic: 'user-events' });
      
      // Start consuming messages
      this.consumeMessages();
      
      logger.info('Cart service Kafka client initialized');
    } catch (error) {
      logger.error('Failed to initialize Kafka client:', error);
    }
  }

  async sendCartEvent(eventType, cartData) {
    try {
      await this.producer.send({
        topic: 'cart-events',
        messages: [
          {
            partition: 0,
            key: cartData.userId,
            value: JSON.stringify({
              eventType,
              data: cartData,
              timestamp: new Date().toISOString(),
              service: 'cart-service'
            })
          }
        ]
      });
      
      logger.info(`Cart event sent: ${eventType}`, cartData);
    } catch (error) {
      logger.error('Failed to send cart event:', error);
    }
  }

  async consumeMessages() {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const messageValue = JSON.parse(message.value.toString());
          logger.info(`Received message from topic ${topic}:`, messageValue);
          
          switch (topic) {
            case 'cart-requests':
              await this.handleCartRequest(messageValue);
              break;
            case 'product-events':
              await this.handleProductEvent(messageValue);
              break;
            case 'user-events':
              await this.handleUserEvent(messageValue);
              break;
            default:
              logger.warn(`Unhandled topic: ${topic}`);
          }
        }
      });
    } catch (error) {
      logger.error('Error consuming messages:', error);
    }
  }

  async handleCartRequest(message) {
    // Log cart requests for analytics
    logger.info('Cart request tracked:', message);
  }

  async handleProductEvent(message) {
    // Handle product updates that might affect cart items
    if (message.eventType === 'PRODUCT_DELETED') {
      logger.info('Product deleted, need to remove from carts:', message.data);
      // Implement cart cleanup logic here
    }
  }

  async handleUserEvent(message) {
    // Handle user events that might affect cart
    if (message.eventType === 'USER_DELETED') {
      logger.info('User deleted, need to remove cart:', message.data);
      // Implement cart cleanup logic here
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    logger.info('Cart service Kafka client disconnected');
  }
}

module.exports = new KafkaClient();