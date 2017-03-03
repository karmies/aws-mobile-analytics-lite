var domReady = new Promise(function (resolve, reject) {
  document.addEventListener('DOMContentLoaded', resolve)
})

domReady
.then(function markLoaded() {
  var el = document.querySelector('#loading')
  el.classList.remove('bg-info')
  el.classList.add('bg-success')
  el.innerText = el.innerText + ' Done! ✔'
})
.then(function markWaitingToInitialize() {
  var el = document.querySelector('#initializing')
  el.classList.remove('bg-warning')
  el.classList.add('bg-info')
  el.innerText = 'Initializing awsmaLite dependencies...'
})

var envConfig

fetch('env.json')
.then(function handleResponse(response) {
  if (response.ok) { return response.json() }
  else { return Promise.reject('env JSON request failed') }
})
.then(function initialize(config) {
  envConfig = config
  return awsmaLite.initialize({
    dependenciesHref: 'awsmalite-aws.js',
    region: config.AWSMA_REGION,
    identityPoolId: config.AWSMA_IDENTITY_POOL_ID,
    appId: config.AWSMA_APP_ID
  })
  .then(function updateStatus() {
    return domReady.then(function markInitialized() {
      var el = document.querySelector('#initializing')
      el.classList.remove('bg-info')
      el.classList.add('bg-success')
      el.innerText = el.innerText + ' Done! ✔'
    })
  })
  .catch(function handleError(err) {
    domReady.then(function markError() {
      var el = document.querySelector('#initializing')
      el.classList.remove('bg-info')
      el.classList.add('bg-danger')
      el.innerText = 'awsmaLite library initialization failure: ' + err
    })
    throw err
  })
})
.then(function recordEvent() {
  return awsmaLite.recordEvent(envConfig.AWSMA_EVENT_NAME,
    { 'TEST ATTRIBUTE': 'THIS IS A TEST' },
    { 'TEST METRIC': 42.42 }
  )
  .then(function markRecording() {
    var el = document.querySelector('#recording')
    if (el.classList.contains('bg-danger')) {
      throw new Error('recording failed before initialization completed')
    }
    el.classList.remove('bg-warning')
    el.classList.add('bg-info')
    el.innerText = 'Recording custom "' + envConfig.AWSMA_EVENT_NAME + '" event... ' +
      'Watch network tab to see when event is sent.'
  })
  .catch(function handleError(err) {
    domReady.then(function markError() {
      var el = document.querySelector('#recording')
      el.classList.remove('bg-info')
      el.classList.add('bg-danger')
      el.innerText = 'Failed to record custom event: ' + err
    })
  })
})
