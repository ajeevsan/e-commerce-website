const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

class KafkaClient {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'api-gateway',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'api-gateway-group' });
  }

  async init() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      
      // Subscribe to response topics
      await this.consumer.subscribe({ topic: 'service-responses' });
      
      logger.info('Kafka client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Kafka client:', error);
    }
  }

  async sendEvent(topic, message) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            partition: 0,
            key: message.userId || 'anonymous',
            value: JSON.stringify(message),
            timestamp: Date.now()
          }
        ]
      });
      
      logger.info(`Event sent to topic ${topic}:`, message);
    } catch (error) {
      logger.error(`Failed to send event to topic ${topic}:`, error);
    }
  }

  async consumeMessages() {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const messageValue = JSON.parse(message.value.toString());
          logger.info(`Received message from topic ${topic}:`, messageValue);
          
          // Handle different message types
          switch (topic) {
            case 'service-responses':
              await this.handleServiceResponse(messageValue);
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

  async handleServiceResponse(message) {
    // Handle service responses - could be used for logging, metrics, etc.
    logger.info('Service response received:', message);
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    logger.info('Kafka client disconnected');
  }
}

module.exports = new KafkaClient();
