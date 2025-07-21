const {redisClient} = require('../config/cache')

//! handle to get all cart data
const handleGetCart = async (eventData) => {
    try {
        console.log('Processing cart get event', eventData);
        
        if(eventData){
            await redisClient.set(
                `user: ${eventData.userId}`,
                eventData.timestamp,
                1800 //30 min
            );
        }

        console.log('Get Cart event processed successfully');
    } catch (error) {
        console.error('Error processing get cart event:', error);
        throw error
    }
}

//! handle to create cart
const handleCreateCart = async (eventData) => {
    try {
        console.log('Processing cart create event', eventData);

        if(eventData){
            console.log('Create Cart Event processed successfully')
            await redisClient.set(
                `user: ${eventData.userId}-${eventData.productId}`,
                eventData.timestamp,
                1800 // 30 min
            )
        }
    } catch (error) {
        console.error('Error processing get cart event:', error);
        throw error
    }
}

const handleAddToCart = async (eventData) => {
    try {
        console.log('Processing add to cart event')

        //! add after events work that needs to be done
        // if(eventData){

        // }
    } catch (error) {
        console.error('Error processing get cart event:', error);
        throw error
    }
}

// const handleUpdateItem = async 