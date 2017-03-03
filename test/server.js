require('dotenv').config()

http = require('http')
https = require('https')
fs = require('fs')

express = require('express')

const PORT = process.env.PORT || 8021
const HTTPS_PORT = process.env.HTTPS_PORT || 43021

app = express()

app.get('/env.json', (req, res) => {
  res.json(process.env)
})

app.use(express.static('test'))
app.use(express.static('dist'))

var httpServer = http.createServer(app)

var credentials = {
  key: fs.readFileSync('./test/example_com.key', 'utf8'),
  cert: fs.readFileSync('./test/example_com.cert', 'utf8')
}
var httpsServer = https.createServer(credentials, app)

httpServer.listen(PORT)
httpsServer.listen(HTTPS_PORT)

console.log('Open the test server at http://localhost:' + PORT + ' or https://localhost:' + HTTPS_PORT)
