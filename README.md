# Build instructions

Clone the repository

```
npm install
npm run watch
```

# Environment Varaibles

For full functionality you need to provide some variables either as environment variables or in a `.env` file.

```
APP_SECRET="" for cookies
CONSUMER_KEY=""  twitter api key
CONSUMER_SECRET="" twitter api secret
GCM_API_KEY="" google cloud messaging api key
REDISTOGO_URL="redis://.... redis url (can be undefined if you are running a local redis server)
SERVER_URL= url to use for redirecting the user back to the application after authenticating.
```
