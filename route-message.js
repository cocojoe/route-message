"use latest";

var async = require('async@1.0.0');
var watson = require('watson-developer-cloud@2.0.1');

/**
 * Analyze message body, suggests routes and provides further insight into
 * the emotional impact of the message.
 *
 * 1. Check message language against team support
 * 1.1 @todo API Translate non team languages
 * 2. Analyze general sentiment of message, e.g. Strong postive or negative
 * 2.1 @todo Train sentiment filter
 * 3. Further analysis and taggng of emotional impact
 * 4. Suggest route
 *
 * Disclaimer: Task is more verbose for demo purposes.
 *
 * @param {secret} API_KEY - Alchemy Language API Key
 */
module.exports = function(ctx, cb) {

    // Values for demo purposes
    let routingQueue = {
        LOW: 'Low',
        DEFAULT: 'Default',
        POSITIVE: 'Positive',
        NEGATIVE: 'Negative',
        TRANSLATE: 'Translate'
    };

    // Languages spoken by support team
    // @todo Retrieve from Auth0 users user_metadata
    let teamLanguages = ['en', 'es'];

    // @todo Retrieve from Auth0 users user_metadata, targeted sentiment
    // let teamSkills = ['Java', 'Objective-C', 'Swift', 'iOS', 'Android'];

    // Secret API key
    let API_KEY = ctx.data.API_KEY;
    let bodyJSON = JSON.parse(ctx.body_raw);

    // IBM Watson - Alchemy Language API
    let alchemy_language = watson.alchemy_language({
        api_key: API_KEY
    });

    let parameters = {
        'text': bodyJSON.message
    };

    // Demo debug
    console.log(parameters);

    // Check common language
    alchemy_language.language(parameters, function(err, responeJSON) {
        // Reducing priority as potential spam or low value content
        if (err) {
            console.log(err);
            return cb(null, routeMessage(routingQueue.LOW));
        }

        // Check message against supported team languages
        let messageLanguage = responeJSON["iso-639-1"];

        if (teamLanguages.indexOf(messageLanguage) < 0) {
            // @todo Push into Google Translate API
            return cb(null, routeMessage(routingQueue.TRANSLATE));
        }

        // Perform analysis techniques
        async.parallel({
            sentiment: function(callback) {
                // Gauge the overall sentiment of the message
                alchemy_language.sentiment(parameters, function(err, responseJSON) {
                    callback(err, responseJSON);
                });
            },
            emotion: function(callback) {
                // Discover emotions in the message
                // Turns out only English is supported
                if (messageLanguage !== 'en') {
                    callback(null, null);
                } else {
                    alchemy_language.emotion(parameters, function(err, responseJSON) {
                        callback(err, responseJSON);
                    });
                }
            }
        }, function(err, results) {
            if (err) {
                console.log(err);
                return cb(null, routeMessage(routingQueue.DEFAULT));
            }

            // Process sentiment
            let sentimentInfo = results.sentiment.docSentiment;
            let sentimentRoute = routingQueue.DEFAULT;
            let tags = [];

            // Check for strong negative or positive sentiment
            if (sentimentInfo.score > 0.5) {
                sentimentRoute = routingQueue.POSITIVE;
            } else if (sentimentInfo.score < -0.5) {
                sentimentRoute = routingQueue.NEGATIVE;
            }

            // Process emotional analysis
            if (results.emotion) {
                let emotionInfo = results.emotion.docEmotions;
                for (var emotion in emotionInfo) {
                    console.log('Emotion: ' + emotion + ', Weight: ' + emotionInfo[emotion]);
                    if (emotionInfo[emotion] > 0.4) {
                        tags.push(emotion);
                    }
                }
            }

            return cb(null, routeMessage(sentimentRoute, tags));
        });
    });

    // Format response
    function routeMessage(queue = routingQueue.DEFAULT, tags = []) {

        let response = {
            'route': queue,
            'tags': tags
        };

        return response;
    }

};
