// /service/authService/kafka/kafkaProducer.js

const { producer } = require('../../shared/kafkaClient');

class CartKafkaProducer {
    constructor() {
        this.isconnected = false;
    }

    async connect() {
        if (!this.isConnected) {
            await producer.connect();
            this.isConnected = true;
            console.log('Kafka Cart Producer connected');
        }
    }

    async sendEvent(topic, message) {
        try {
            await this.connect()

            const result = await producer.send({
                topic,
                messages: [{
                    partition: 0,
                    key: message.userId || message.email || Date.now().toString(),
                    value: JSON.stringify({
                        ...message,
                        timestamp: new Date().toISOString(),
                        service: 'cart-service'
                    }),
                    headers: {
                        'content-type': 'application/json',
                        'source': 'cart-service'
                    }
                }]
            });

            console.log(`Event sent to topic ${topic}:`, result)
            return result
        } catch (error) {
            console.error('Error sending kafka event:', error)
            throw error;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await producer.disconnect()
            this.isconnected = false
            console.log('Kafka producer disconnected')
        }
    }
}

const kafkaProducer = new CartKafkaProducer

//! Graceful shutdown
process.on('SIGINT', async () => {
    await kafkaProducer.disconnect();
    process.exit(0);
});

module.exports = { sendEvent: (topic, message) => kafkaProducer.sendEvent(topic, message) }