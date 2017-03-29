var aws4 = require('aws-v4-sign-small')
var aws4Hash = require('aws-v4-sign-small/lib/hash')

function fetchIdentityId(identityPoolId) {
  return makeAwsRequest({
    service: 'cognitoidentity',
    target: 'AWSCognitoIdentityService.GetId',
    endpoint: 'https://cognito-identity.us-east-1.amazonaws.com/',
    method: 'POST',
    data: { IdentityPoolId: identityPoolId }
  })
  .then(function getIdentityIdData(data) {
    return data.IdentityId
  })
}

function fetchCredentials(identityId) {
  return makeAwsRequest({
    service: 'cognitoidentity',
    target: 'AWSCognitoIdentityService.GetCredentialsForIdentity',
    endpoint: 'https://cognito-identity.us-east-1.amazonaws.com/',
    method: 'POST',
    data: { IdentityId: identityId }
  })
  .then(function getCredentialsData(data) {
    var expireTime = new Date(data.Credentials.Expiration * 1000)
    return {
      _identityId: data.IdentityId,
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretKey,
      sessionToken: data.Credentials.SessionToken,
      expired: false,
      expireTime: expireTime
    }
  })
}

var awsStub = {
  VERSION: '2.17.0',

  config: {},

  CognitoIdentityCredentials: function Credentials(options) {
    var credentials = { expired: true }

    var identityIdPromise
    for (var key in localStorage) {
      if (key.match(/^aws.cognito.identity-id/)) {
        identityIdPromise = Promise.resolve(localStorage.getItem(key))
        break
      }
    }
    if (!identityIdPromise) {
      identityIdPromise = fetchIdentityId(options.IdentityPoolId)
    }

    identityIdPromise.then(function handleIdentityId(identityId) {
      credentials._identityId = identityId
      credentials.params = {
        IdentityId: identityId,
        IdentityPoolId: options.IdentityPoolId,
        RoleSessionName: 'web-identity'
      }

      return fetchCredentials(identityId)
    })
    .then(function handleCredentialsData(data) {
      // Update original credentials object with credentials data:
      for (var key in data) {
        credentials[key] = data[key]
      }
    })
    .catch(function handleError(err) {
      if (options.onError) {
        options.onError(err)
      } else {
        console.error('Error getting AWS credentials:', err)
      }
    })
      
    return credentials
  }
}

/**
 * @param {object} credentials
 * @return {boolean} - true if credentials are expired, else false
 */
function isExpired(credentials) {
  if (credentials.expired) { return credentials.expired }
  
  var now = new Date()
  return now >= credentials.expireTime
}

/**
 * @param {Response} response - Fetch Response object
 * @return {boolean} - true if response has JSON data, else false
 */
function isJsonResponse(response) {
  return response.status !== 202 &&
     response.headers.get('content-type').match(/application\/.*json/)
}

/**
 * @param {object} params
 * @param {boolean} [params.authenticated=false] - If true, non-expired
 * credentials must be set in config or else the request will be rejected
 * before being sent.
 * @return {promise<object|Error>}
 */
function makeAwsRequest(params) {
  var credentials = awsStub.config.credentials || { expired: true }
  if (params.authenticated && isExpired(credentials)) {
    // If credentials are bad or expired, mark them as expired:
    if (credentials) { credentials.expired = true }

    // Refresh stale creds asynchronously (if Identity ID is initialized):
    if (credentials._identityId) {
      fetchCredentials(credentials._identityId)
      .then(function updateCredentials(credentials) {
        awsStub.config.credentials = credentials
      })
    }

    // Immediately reject the request that failed due to stale creds:
    return Promise.reject(new Error('Credentials not set or expired'))
  }

  var urlParts = params.endpoint.match(/https?:\/\/([^\/]+)([^\?#]+)/)
  var headers = params.headers
    ? JSON.parse(JSON.stringify(params.headers))
    : {}
  if (params.target) { headers['x-amz-target'] = params.target }
  headers['x-amz-user-agent'] = 'aws-sdk-js/2.17.0 callback'
  if (params.data && !headers['content-type']) {
    headers['content-type'] = 'application/x-amz-json-1.1'
  }
  var requestData
  if (params.data) {
    requestData = JSON.parse(JSON.stringify(params.data))
    if (requestData['clientContext']) {
      headers['x-amz-client-context'] = params.data['clientContext']
      delete requestData['clientContext']
    }
  }
  var body = requestData ? JSON.stringify(requestData) : undefined
  // The aws4 lib we use does not correctly sign the body,
  // so we must sign manually here:
  if (body) {
    headers['X-Amz-Content-Sha256'] = aws4Hash(body)
  }
  var opts = {
    host: urlParts[1],
    path: urlParts[2],
    method: params.method,
    headers: headers,
    body: body,
    region: awsStub.config.region,
    service: params.service
  }
  aws4.sign(opts, credentials)
  if (!credentials.sessionToken) {
    delete opts.headers.authorization
    delete opts.headers.Authorization
  }
  return window.fetch(params.endpoint, {
    method: opts.method,
    body: opts.body,
    headers: opts.headers
  })
  .then(function parseResponse(response) {
    var dataPromise = isJsonResponse(response)
      ? response.json()
      : response.text()
    return response.ok
      ? dataPromise
      : dataPromise.then(function throwError(errorData) {
          return Promise.reject(errorData)
        })
  })
}

/**
 * Constructor for pseudo-MobileAnalytics client.
 * @return {object} pseudo-MobileAnalytics client instance
 */
awsStub.MobileAnalytics = function MobileAnalytics(clientOptions) {
  return {

    /**
     * Calls the AWS MobileAnalytics `putEvents` HTTP API
     * @see http://docs.aws.amazon.com/mobileanalytics/latest/ug/PutEvents.html
     * Mostly compatible with the AWS SDK MobileAnalytics client `putEvent` method.
     * (Note, the original client returns an `AWSRequest` instance; this method
     * does not return an `AWSRequest` instance and therefore only supports the
     * callback method of invocation.)
     * @param {object} eventBatch - set of event data, compatible with the AWS SDK
     * MobileAnalytics client `putEvent` method.
     * @param {function} callback - callback to be invoked with `err`, `data` params.
     * NOTE, the `putEvents` API does not include any data in the response. The
     * callback signifies the operation has completed successfully but does not
     * provide any other information except in error cases.
     */
    putEvents: function putEvents(eventBatch, callback) {
      if (!callback) { callback = function () {} }

      makeAwsRequest({
        authenticated: true,
        service: 'mobileanalytics',
        endpoint: 'https://mobileanalytics.us-east-1.amazonaws.com/2014-06-05/events',
        method: 'POST',
        data: eventBatch
      })
      .then(callback.bind(this, null))
      .catch(callback)
    }
  }
}

module.exports = awsStub
