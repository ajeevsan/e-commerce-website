// /service/authService/kafka/kafkaConsumer.js

const { consumer } = require('../../shared/kafkaClient');

class CartKafkaConsumer {
   constructor() {
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  async connect() {
    if (!this.isConnected) {
      await consumer.connect();
      this.isConnected = true;
      console.log('Kafka Consumer connected');
    }
  }

  addHandler(topic, handler) {
    this.messageHandlers.set(topic, handler);
  }

  async subscribe(topics) {
    await this.connect();
    
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const handler = this.messageHandlers.get(topic);
          if (handler) {
            const messageValue = JSON.parse(message.value.toString());
            await handler(messageValue, message);
          } else {
            console.log(`No handler found for topic: ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });
  }

  async disconnect() {
    if (this.isConnected) {
      await consumer.disconnect();
      this.isConnected = false;
      console.log('Kafka Consumer disconnected');
    }
  }

}

const kafkaConsumer = new CartKafkaConsumer()

// Graceful shutdown
process.on('SIGINT', async () => {
  await kafkaConsumer.disconnect();
  process.exit(0);
});

module.exports = kafkaConsumer;