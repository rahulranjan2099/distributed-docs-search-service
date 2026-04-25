const { producer } = require('../config/kafka')

const sendDocumentEvent = async (type, data) => {
    try {
        await producer.send({
            topic: 'documents',
            messages: [
                {
                    key: String(data.tenant_id),
                    value: JSON.stringify({ 
                        type, 
                        data, 
                        timestamp: new Date().toISOString() 
                    })
                }
            ]  
        })
        console.log(`Event sent: ${type}`);
    } catch (error) {
        console.log('Error sending document event:', error);
    }
}

module.exports = { 
    sendDocumentEvent
}