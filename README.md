#route-message
Emotional message routing.

### What's this all about?

Well it's a rough demo based around the use case of helping route messages and being able to escalate those messages,
based upon the emotional impact to the client.

### Install

This has been designed to run on the awesome [Auth0 Webtasks](https://webtask.io/)
You will need your own IBM Watson - Alchemy Language API Key.

`wt create route-message.js --secret API_KEY=XXXX`

### Try it

Try the example JSON samples in this repo as follows:

`curl -X POST -d @message-en-positive.txt https://webtask.it.auth0.com/api/run/...YOURPATH.../route-message --header "Content-Type:application/json"`

### Notes

Check code comments for more information, log is extra verbose for demo purposes.
