var AWS = require('aws-sdk');
var sqs = new AWS.SQS({region: 'us-east-1'});
var lambda = new AWS.Lambda({region: 'us-east-1'});
var sns = new AWS.SNS();
var https = require('https');
var ses = new AWS.SES({apiVersion: '2010-12-01'});
//var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
var docClient = new AWS.DynamoDB.DocumentClient();

//var async = require('async');


var myurl = 'https://api.yelp.com/v3/businesses/search';


function receiveMessages(callback) {
  var params = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/041701594760/cloud_2',
    MaxNumberOfMessages: 10,
    WaitTimeSeconds:20,
    VisibilityTimeout:30
  };

  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.error(err, err.stack);
      callback(err);
    } else {
      callback(null, data.Messages);
    }
  });
}

/*function invokeWorkerLambda(task, callback) {
  var params = {
    FunctionName: WORKER_LAMBDA_NAME,
    InvocationType: 'Event',
    Payload: JSON.stringify(task)
  };

  lambda.invoke(params, function(err, data) {
    if (err) {
      console.error(err, err.stack);
      callback(err);
    } else {
      callback(null, data);
    }
  });
}*/

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function handleSQSMessages(context, callback) {
  console.log("In Receive message\n");

  receiveMessages(function(err, messages) {
    if (messages && messages.length > 0) {
        console.log(messages.length);

        var invocations = [];
        messages.forEach(function(message) {

            /*invocations.push(function(callback) {
              invokeWorkerLambda(message, callback);
            });*/
            var num = 0;
            var dataRecvd = false;

            var deleteParams = {
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/041701594760/cloud_2',
                ReceiptHandle: message.ReceiptHandle
            }

            //console.log(message);
            var botRequestData = JSON.parse(message['Body']);

            //we have put this to handle empty objects
            if (Object.keys(botRequestData).length === 0)
            {
              sqs.deleteMessage(deleteParams, function(err, data2) {
                if (err) {
                  console.log("Delete Error", err);
                }
                else {
                  console.log("Message Deleted", data2);
                }
              });

              return;
            }

            console.log(botRequestData["customerPhoneNumber"]);
            console.log(botRequestData["locationusa"]);
            console.log(botRequestData["cuisine"]);
            console.log(botRequestData["dateTime"]);
            console.log(botRequestData['timeOfEvent']);

            var dateObj = new Date(botRequestData["dateTime"] + ' ' + botRequestData['timeOfEvent']);

            var timeStamp = dateObj.getTime()/1000;

            //var queryString = '/v3/businesses/search?limit=3&term=dinner&' + 'location=' + botRequestData["locationusa"].trim() + '&categories='
            //                  + botRequestData["cuisine"].trim().toLowerCase() + '&open_at=' + timeStamp;

            var queryString = '/_search?q=Cuisine:' + botRequestData["cuisine"].trim().toLowerCase()

            console.log(queryString);

            https.get({
            		  host : 'search-assignment3-es-qwxifld3qudrzq4qslz3qonaui.us-east-1.es.amazonaws.com',
            		  path : queryString,
            		  method: 'GET'
            	  }, function(res){
                var resp = "";
                res.on("data", function(data){
                  resp += data;
                });


                res.on("end", function(){
                  //console.log(resp);
                  var restoList = '';
                  var jsonResp = JSON.parse(resp);

                  var hits = jsonResp["hits"]["hits"]

                  var msgData = "";

                  if (jsonResp['hits']['total'] > 0)
                  {

                	   hits.forEach(function(respData, index){

                        if (index >= 5)
                          return true;

                          var dbParams = {
                              TableName : "yelp-restaurant",
                              Key : {
                                "restaurantId" : respData["_source"]["RestaurantID"]
                              }
                          };


                          //console.log("querying db" + JSON.stringify(dbParams));

                          docClient.get(dbParams, function (err, data) {

                            //console.log('came here');
                            if (err)
                            {
                              console.log("Error in dynamo db query" + err.stack)
                            }
                            else
                            {
                              //console.log("recieved data");
                              //console.log(data);

                              num= num+1;
                        	    var temp = num + '. ' + data['Item']['Name'] + ' at ' + data['Item']['Location'] +  '\n';
                      	      restoList += temp; //add restaurant name to the list
                            }
                          });

                          //console.log("resto " + respData["_source"]["RestaurantID"] + " " + (index+1));
                      });

                	  /*businesses.forEach( (item, index) => {

                	    var num = index+1;
                	    var temp = num.toString() + '. ' + item['name'] + ' at ' + item['location']['address1'] + ' ';
              	      restoList += temp; //add restaurant name to the list
              	    });*/

            	      //console.log(dateObj.toLocaleTimeString('en-US'));

            	     // console.log("resto List " + restoList)

            	      dataRecvd = true;

                  }
                  else
                  {
                    msgData = 'Hello! We are currently not able to find any ' + botRequestData['cuisine'] +  ' restaurants at ' + botRequestData['locationusa'] + ' for ' +
                              botRequestData['dateTime'];
                  }

                

            	/*	var data1 = {
                  Message : msgData,
                  MessageStructure: 'string',
                  PhoneNumber : '+1' + botRequestData["customerPhoneNumber"]
                };

                sns.publish(data1, function(err, data2) {
                  if (err)
                    {

                      console.log(err, err.stack);
                      console.log("error "+ err);
                      console.log("stack "+ err.stack);
                    } // an error occurred
                  else
                    {  console.log( "Msg Resp: " + data2);   }        // successful response
                });
                */

                var idParams = {Identities : [botRequestData['customerPhoneNumber']]};

                ses.getIdentityVerificationAttributes(idParams, function(err, data) {
                  if (err)
                  {
                    console.log(err, err.stack); // an error occurred
                  }
                  else
                  {
                    console.log(JSON.stringify(data));           // successful response

                    var verAttr = data['VerificationAttributes'];

                   if (verAttr == undefined || Object.keys(verAttr).length == 0)
                   {

                      console.log('ver attr undefined');

                      var verifParams = { EmailAddress: botRequestData['customerPhoneNumber']};

                      ses.verifyEmailIdentity(verifParams, function(err, data) {
                          if (err) console.log(err, err.stack); // an error occurred
                          else     console.log('verifParams: ' +data);           // successful response
                      });

                   }
                    else
                    {
                      console.log('inside email verification step');

                      var status= verAttr[botRequestData['customerPhoneNumber']];
                      if (status == undefined || Object.keys(status).length == 0)
                      {
                        console.log('undefined');
                      }
                      else
                      {
                        var finalStatus = status['VerificationStatus'];

                        if (finalStatus == 'Success')
                        {
                          if (dataRecvd == true)
                          {
                            msgData = 'Hello! Here are my ' + botRequestData['cuisine'] + ' restaurant suggestions for ' + botRequestData['noOfPeople'] +
                            ' people, for ' + botRequestData['dateTime'] + ' at '  + botRequestData['timeOfEvent']  + ' are ' + restoList + ' Enjoy your meal!';
                          }

                          var params1 = {
                            Destination: {

                              ToAddresses: [
                                botRequestData['customerPhoneNumber']
                              ]
                            },
                            Message: {
                              Body: {
                                Text: {
                                 Charset: "UTF-8",
                                 Data: msgData
                                }
                               },
                               Subject: {
                                Charset: 'UTF-8',
                                Data: 'Food Suggestions for you'
                               }
                              },
                            Source: 'sst390@nyu.edu',
                            ReplyToAddresses: [
                                'sst390@nyu.edu',

                            ],
                          };

                          console.log('Send Promise initiation\n');

                          // Create the promise and SES service object
                          var sendPromise = ses.sendEmail(params1).promise();

                          console.log('sending email ' + botRequestData['customerPhoneNumber']);

                          // Handle promise's fulfilled/rejected states
                          sendPromise.then(
                            function(data) {
                              console.log(data.MessageId);
                            }).catch(
                              function(err) {
                              console.error(err, err.stack);
                            });


                          sqs.deleteMessage(deleteParams, function(err, data2) {
                            if (err) {
                              console.log("Delete Error", err);
                            }
                            else {
                              console.log("Message Deleted", data2);
                            }
                          });

                        }
                        else
                        {
                          console.log('finalStatus: ' + finalStatus);
                        }
                      }
                    }
                  }
                });
              });
            });
        });

        /*async.parallel(invocations, function(err) {
          if (err) {
            console.error(err, err.stack);
            callback(err);
          }
          else {
              if (context.getRemainingTimeInMillis() > 20000) {
               handleSQSMessages(context, callback);
            } else {
              callback(null, 'PAUSE');
            }
          }
        });*/
    }
    else {

      if (err)
      {
        console.log(err);
      }
      else
      {
        callback(null, 'DONE');

      }
    }
  });
}

exports.handler = function(event, context, callback) {

  handleSQSMessages(context, callback);
};
