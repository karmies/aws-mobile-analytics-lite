/**
 * This module defines all the AWS SDK dependencies for Mobile Analytics.
 */
var AWS = require('aws-sdk')
var AMA = require('aws-sdk-mobile-analytics')

if (typeof window !== 'undefined') {
  window.AWS = AWS
  window.AMA = AMA
}

var awsmaDependencies = {
  AWS: AWS,
  AMA: AMA
}

module.exports = awsmaDependencies
