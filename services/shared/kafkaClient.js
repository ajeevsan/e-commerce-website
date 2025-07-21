// services/shared/kafkaClient.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'microservices-cluster',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

const consumer = kafka.consumer({ 
  groupId: 'microservices-cluster',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

module.exports = { kafka, producer, consumer };