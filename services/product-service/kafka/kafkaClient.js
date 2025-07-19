const { Kafka } = require('kafkajs');
const logger = require('../config/logger');

class KafkaClient {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'product-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka1:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'product-service-group' });
  }

  async init() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      
      // Subscribe to product-related topics
      await this.consumer.subscribe({ topic: 'product-requests' });
      await this.consumer.subscribe({ topic: 'inventory-updates' });
      
      // Start consuming messages
      this.consumeMessages();
      
      logger.info('Product service Kafka client initialized');
    } catch (error) {
      logger.error('Failed to initialize Kafka client:', error);
    }
  }

  async sendProductEvent(eventType, productData) {
    try {
      await this.producer.send({
        topic: 'product-events',
        messages: [
          {
            partition: 0,
            key: productData.productId || productData.id,
            value: JSON.stringify({
              eventType,
              data: productData,
              timestamp: new Date().toISOString(),
              service: 'product-service'
            })
          }
        ]
      });
      
      logger.info(`Product event sent: ${eventType}`, productData);
    } catch (error) {
      logger.error('Failed to send product event:', error);
    }
  }

  async sendInventoryUpdate(productId, quantity, operation) {
    try {
      await this.producer.send({
        topic: 'inventory-updates',
        messages: [
          {
            partition: 0,
            key: productId,
            value: JSON.stringify({
              productId,
              quantity,
              operation, // 'increase', 'decrease', 'set'
              timestamp: new Date().toISOString(),
              service: 'product-service'
            })
          }
        ]
      });
      
      logger.info(`Inventory update sent for product ${productId}:`, { quantity, operation });
    } catch (error) {
      logger.error('Failed to send inventory update:', error);
    }
  }

  async consumeMessages() {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const messageValue = JSON.parse(message.value.toString());
          logger.info(`Received message from topic ${topic}:`, messageValue);
          
          switch (topic) {
            case 'product-requests':
              await this.handleProductRequest(messageValue);
              break;
            case 'inventory-updates':
              await this.handleInventoryUpdate(messageValue);
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

  async handleProductRequest(message) {
    // Log product requests for analytics
    logger.info('Product request tracked:', message);
  }

  async handleInventoryUpdate(message) {
    // Handle inventory updates from other services
    logger.info('Inventory update received:', message);
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    logger.info('Product service Kafka client disconnected');
  }
}

module.exports = new KafkaClient();