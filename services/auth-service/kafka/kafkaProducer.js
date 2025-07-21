const { producer } = require('../../shared/kafkaClient');

class KafkaProducer {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await producer.connect();
      this.isConnected = true;
      console.log('Kafka Producer connected');
    }
  }

  async sendEvent(topic, message) {
    try {
      await this.connect();
      
      const result = await producer.send({
        topic,
        messages: [{
          partition: 0,
          key: message.userId || message.email || Date.now().toString(),
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            service: 'auth-service'
          }),
          headers: {
            'content-type': 'application/json',
            'source': 'auth-service'
          }
        }]
      });

      console.log(`Event sent to topic ${topic}:`, result);
      return result;
    } catch (error) {
      console.error('Error sending Kafka event:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await producer.disconnect();
      this.isConnected = false;
      console.log('Kafka Producer disconnected');
    }
  }
}

const kafkaProducer = new KafkaProducer();

//! Graceful shutdown
process.on('SIGINT', async () => {
  await kafkaProducer.disconnect();
  process.exit(0);
});

module.exports = { sendEvent: (topic, message) => kafkaProducer.sendEvent(topic, message) };

