/**
 * This module defines a lightweight bootstrapper for the awsmaLite library.
 * It is designed to be small enough to compile inline with other app
 * initialization code, and load its dependencies asynchronously.
 */
var loadScript = require('tiny-script-loader/loadScriptPromised')

var mobileAnalyticsManagerPromise

var awsmaLite = {

  /**
   * @param {object} config - Configuration options for the AWS SDK
   * and AWS Mobile Analytics Manager. This object is passed through
   * unchanged to the Mobile Analytics Manager constructor.
   * The following parameters are required for initializing the
   * SDK and MA Manager, but many more are supported:
   * @param {string} config.dependenciesHref - Reference to the awsmaLite
   * dependencies module. May be a relative HREF, e.g., "/awsmalite-awssdk.js".
   * @param {string} config.region - AWS region (e.g., "us-east-1")
   * @param {string} identityPoolId - AWS Cognito Identity Pool ID
   * @param {string} appId - AWS Mobile Analytics App ID
   * @see https://github.com/aws/aws-sdk-mobile-analytics-js
   * @return {Promise<object|error>} - resolves with initialized
   * AWS MobileAnalytics Manager instance
   */
  initialize: function initialize(config) {
    mobileAnalyticsManagerPromise =
      loadScript(config.dependenciesHref)
      .then(function executeInitialize() {
        AWS.config.region = config.region
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: config.identityPoolId
        })
        mobileAnalyticsClient = new AMA.Manager(config)
        return mobileAnalyticsClient
      })
    return mobileAnalyticsManagerPromise
  },

  /**
   * Records an event with AWS Mobile Analytics.
   * Rejects with error if `awsmaLite.initialize()` has not yet been called.
   * @param {string} name - custom event name
   * @param {object} attributes - custom event attributes
   * (map of attribute names to string values)
   * @param {object} metrics - custom event metrics
   * (map of metric names to number values)
   * @return {Promise<object|error>} - resolves with recorded event
   * parameters when event has been successfully recorded, or rejects
   * with error if event fails to record
   */
  recordEvent: function recordEvent(name, attributes, metrics) {
    if (!mobileAnalyticsManagerPromise) {
      return Promise.reject(new Error('awsmaLite must be initialized before calling recordEvent'))
    }
    return mobileAnalyticsManagerPromise
      .then(function executeRecordEvent(mobileAnalyticsManager) {
        return mobileAnalyticsManager.recordEvent(name, attributes, metrics)
      })
  }
}

if (typeof window !== 'undefined') {
  window.awsmaLite = awsmaLite
}

module.exports = awsmaLite
