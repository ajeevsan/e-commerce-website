const KAFKA_TOPICS = {
  USER_EVENTS: 'user-events',
  PRODUCT_EVENTS: 'product-events',
  CART_EVENTS: 'cart-events',
  ORDER_EVENTS: 'order-events',
  NOTIFICATION_EVENTS: 'notification-events',
};

const EVENT_TYPES = {
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
  },
  PRODUCT: {
    CREATED: 'product.created',
    UPDATED: 'product.updated',
    DELETED: 'product.deleted',
    VIEWED: 'product.viewed',
  },
  CART: {
    ITEM_ADDED: 'cart.item.added',
    ITEM_REMOVED: 'cart.item.removed',
    ITEM_UPDATED: 'cart.item.updated',
    CLEARED: 'cart.cleared',
  },
  ORDER: {
    CREATED: 'order.created',
    UPDATED: 'order.updated',
    CANCELLED: 'order.cancelled',
    FULFILLED: 'order.fulfilled',
  },
};

module.exports = {
  KAFKA_TOPICS,
  EVENT_TYPES,
};