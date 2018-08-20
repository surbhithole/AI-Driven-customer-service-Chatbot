'use strict';
var QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/041701594760/cloud_2';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({region : 'us-east-1'});
     
// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled ("Thanks, your pizza will arrive in 20 minutes")
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}
 
// --------------- Events -----------------------
 
function dispatch(intentRequest, callback) {
    console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const sessionAttributes = intentRequest.sessionAttributes;
    var sendmessage;
    const slots = intentRequest.currentIntent.slots;
    const locationusa = slots.locationusa;
    const cuisine = slots.cuisine;
    const typeOfPeople = slots.typeOfPeople;
    const noOfPeople = slots.noOfPeople;
    const dateTime = slots.dateTime;
    const customerPhoneNumber = slots.customerPhoneNumber;
    const greeting = slots.greeting;
    const timeOfEvent = slots.timeOfEvent;
    
    if(locationusa == null || cuisine == null || typeOfPeople == null || noOfPeople == null || dateTime == null || customerPhoneNumber == null || timeOfEvent == null){
        callback(close(sessionAttributes, 'Fulfilled',
        {
            'contentType': 'PlainText', 
            'content': `Please provide the correct input. Thank You!!`
        }));
    }
        
    if(greeting){
        callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Please provide the correct input. Thank You!!`}));
    }
    
    callback(close(sessionAttributes, 'Fulfilled',
        {
            'contentType': 'PlainText', 
            'content': `You will get the Dining information available in ${locationusa} on ${dateTime} on your Email Address ${customerPhoneNumber} shortly. Thank You!!`
        }
    ));
    
    sendmessage = {
      "locationusa" : locationusa,
      "cuisine" : cuisine,
      "typeOfPeople" : typeOfPeople,
      "noOfPeople" : noOfPeople,
      "dateTime" : dateTime,
      "customerPhoneNumber" : customerPhoneNumber,
      "timeOfEvent" : timeOfEvent
  };
  
  sqsdata(sendmessage)
}



function sqsdata(event) {
  var params = {
    MessageBody: JSON.stringify(event),
    QueueUrl: QUEUE_URL
  };
  sqs.sendMessage(params, function(err,data){
    if(err) {
      console.log('error:',"Fail Send Message" + err);
      //context.done('error', "ERROR Put SQS");  // ERROR with message
    }else{
      console.log('data:',data.MessageId);
      //context.done(null,'');  // SUCCESS 
    }
  });
}


 
// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};