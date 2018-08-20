/*exports.handler = (event,context, callback) => {
    console.log(event);
    callback(null,"hello world");
}*/
/*
exports.handler = (event, context, callback) => {
    console.log(event)
    // TODO implement
    //var userInput = event['messages'][0]['unstructured']['text'] -> this bit taken was crashing so changed the below line
    var userInput = event.messages.toLowerCase();
    if(userInput == "book a table" || userInput == "hey" || userInput == "hello"|| userInput == "Hi"|| userInput == "Hey"|| userInput == "hi"){
        callback(null, 'Hello User');
    }
    else if(userInput == "Weather"|| userInput == "what is the weather" ||userInput == "weather" ){
        callback(null, 'Its cold today');
    }
    else if(userInput == "school"|| userInput == "university"|| userInput == "University"|| userInput == "School"){
        callback(null, 'NYU Tandon');
    }
    else if(userInput == "course"|| userInput == "Course"){
        callback(null, 'Cloud Computing');
    }
    else if(userInput == "GPA"|| userInput == "gpa"){
        callback(null, 'Average');
    }
    else if(userInput == "bye"|| userInput == "Bye"){
        callback(null, 'Bye');
    }
    else{
        callback(null, 'I can only understand -\n1) hi, hey, hello\n2) weather\n3) school\n4) GPA\n5) course\n6) bye');
    }
};
*/

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var lexruntime = new AWS.LexRuntime();

exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        var userInput = event.messages;
        var refId = event.refid;
        var params = {
            botAlias: '$LATEST', /* required, has to be '$LATEST' */
            botName: 'restaurantService', /* required, the name of you bot */
            inputText: userInput, /* required, your text */
            userId: refId, /* required, arbitrary identifier */
            sessionAttributes: {
            someKey: 'STRING_VALUE',
        }

    };

    lexruntime.postText(params, function(err, data) {
        if (err) console.log(err); // an error occurred
        else callback(null, data.message);           // successful response
    });
    } catch (err) {
        console.log(err);
    }
};
