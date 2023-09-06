import express from 'express'
import serveStatic from 'serve-static'
import { spawn } from 'child_process'
import Ganache from 'ganache-core'
import opener from 'opener'
import fs from 'fs'
import Web3 from 'web3'

import simpleIssuer from './issuer-services/_simple'

const HOST = process.env.HOST || 'localhost'
const app = express()

app.get('/', (req, res) => {
  var html = fs.readFileSync(__dirname + '/public/dev.html').toString()
  res.send(html.replace(/\{HOST\}/g, `http://${HOST}:8080/`))
})
app.use(serveStatic('public'))

try {
  var { simpleApp } = require('./issuer-services/config.json')
  simpleIssuer(app, { web3: new Web3(), simpleApp })
} catch(e) {
  /* Ignore */
}

const startGanache = () =>
  new Promise((resolve, reject) => {
    try {
      fs.mkdirSync('./data/db')
    } catch (e) {
      /* Ignore */
    }
    var server = Ganache.server({
      total_accounts: 5,
      default_balance_ether: 100,
      db_path: 'data/db',
      network_id: 999,
      seed: 123,
      mnemonic: "rival alley punch barrel baby other taxi cannon pause achieve caution race"
      // blocktime: 3
    })
    server.listen(8545, err => {
      if (err) {
        return reject(err)
      }
      console.log('Ganache listening. Starting webpack...')
      resolve()
    })
  })

async function start() {
  await startGanache()
  const webpackDevServer = spawn('./node_modules/.bin/webpack-dev-server', [
    '--info=true',
    '--port=8080',
    '--host=0.0.0.0'
  ])
  webpackDevServer.stdout.pipe(process.stdout)
  webpackDevServer.stderr.pipe(process.stderr)
  process.on('exit', () => webpackDevServer.kill())

  const PORT = process.env.PORT || 3344
  app.listen(PORT, () => {
    console.log(`\nListening on host ${HOST}, port ${PORT}\n`)
    setTimeout(() => {
      try{
        const url = `http://${HOST}:${PORT}`
        console.log(`Opening Browser at ${url}`)
        const browser = opener(url)
        browser.unref();
      }catch(err){
        console.log("open browser", err.message);
      }
    }, 4500)
  })
}

start()
