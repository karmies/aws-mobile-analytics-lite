# AWS Mobile Analytics Lite (a.k.a., AWSMA Lite)

This browser-optimized library implements a small subset of the AWS Mobile
Analytics SDK, enough to support the most basic web analytics use cases.
The total minified file size is under 50KB (compared to over 250KB
for the smallest custom build of the official SDK), and the
async bootstrap script adds less than 2KB of Javascript to your minified app code.

## Features / Limations
This library has some limitations to be aware of.

 * Only supports unauthenticated users.
 * Only custom events may be recorded (no monetization events yet).
 * Only one analytics manager instance may be created.
 * Event timestamps are recorded only after the dependencies have loaded, not when
   the event is actually submitted.

This library was created to scratch an itch; if you find a feature missing that
is important to you, please create an issue describing why it's awesome,
or even better, send a pull request with tests.

This library **does** include the full AWS Mobile Analytics manager client,
which implements auto-retry features and other advanced features which are beyond
the scope of this doc.

## Usage
There are two supported entry points for the AWS Mobile Analytics Lite library.

### Bootstrap Script
The `dist/awsmalite.js` script weighs in at under 2KB. It will load all the
dependencies for event recording asynchronously, and collect / cache events locally
while the dependencies load.

You can include the bootstrap script via a script tag:
```
    <script src="/path/to/awsmalite.js"></script>
```

Or you can include the bootstrap script via a `require` declaration and compile
using Browserify or Webpack:
```
    var awsmaLite = require('aws-mobile-analytics-lite')
```

```
// `initialize` MUST be called before any event happens:
awsmaLite.initialize({
  // You must supply a path to the `awsmalite-aws.js` dependencies module here:
  dependenciesHref: 'dist/awsmalite-aws.js',
  region: 'us-east-1',
  identityPoolId: 'YOUR AWS MA IDENTITY POOL ID HERE',
  appId: 'YOUR AWS MA APP ID HERE'
})

// ... Later, when an event occurs ...

awsmaLite.recordEvent('EVENT NAME',
  { 'TEST ATTRIBUTE': 'SOME ATTRIBUTE VALUE' },
  { 'TEST METRIC': 42.42 }
)
```

### Full Dependencies Version
Alternatively, the `awsmalite-aws.js` script includes the entire set of dependencies
for AWS Mobile Analytics Lite with no asynchronous loading required.

You can include the full dependency script via a script tag:
```
    <script src="/path/to/awsmalite-aws.js"></script>
```

Or you can include the bootstrap script via a `require` declaration and compile
using Browserify or Webpack:
```
    var awsmaDependencies = require('aws-mobile-analytics-lite/awssdk-dependencies')
```

The full dependencies module is compatible with a subset of
the AWS Mobile Analytics API, and you can simply copy and paste
the AWS integration instructions:

```
AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'YOUR AWS MA IDENTITY POOL ID HERE'
});

var options = {
    appId : 'YOUR AWS MA APP ID HERE',
    appTitle : APP_TITLE,              //Optional e.g. 'Example App'
    appVersionName : APP_VERSION_NAME, //Optional e.g. '1.4.1'
    appVersionCode : APP_VERSION_CODE, //Optional e.g. '42'
    appPackageName : APP_PACKAGE_NAME  //Optional e.g. 'com.amazon.example'
};

var mobileAnalyticsClient = new AMA.Manager(options);

// ... Later, when an event occurs ...

mobileAnalyticsClient.recordEvent('EVENT NAME',
  { 'TEST ATTRIBUTE': 'SOME ATTRIBUTE VALUE' },
  { 'TEST METRIC': 42.42 }
)
```

## Development
To build the project locally:

```
    npm install
    npm run build
```

### Testing
This project includes a test server and webpage so you can quickly verify the software
will log events to your AWS Mobile Analytics account.

1. Create an AWS Mobile Analytics app account for testing.
1. Get the integration instructions for the Javascript SDK. Make note of the
   following values:
   - Region (typically us-east-1)
   - Identity Pool ID
   - App ID
1. Create a .env file at the base directory of this project and populate it as follows:
   Populate it with the following env variables:
    ```
    AWSMA_REGION={ region here }
    AWSMA_IDENTITY_POOL_ID={ identity pool ID here }
    AWSMA_APP_ID={ app ID here }
    AWSMA_EVENT_NAME={ some unique name for an event, such as "AWSMALITE_TEST_EVENT" }
    ```
1. Run `npm run build`
1. Run `npm test`
1. Follow the link to the test webpage printed from the `npm test` command
1. Look at the test webpage and network tab, verify the library does send events to AWS
1. Check the AWS Mobile Analytics console for your test account an hour or more later
   and verify the custom event was published.

## Feedback
Please post any questions, ideas, bugs, etc. in the Issues section and I will
try to respond quickly.
