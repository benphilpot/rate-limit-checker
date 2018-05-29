var axios = require('axios');
var fs = require('fs')
var logfile = process.env.LOGFILE || 'log.txt'
var logger = fs.createWriteStream(logfile, {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

const checkFrequency = 5;
let previousRemaining ;

function logMessage(...messages) {
  const message = messages.join(' ')
  logger.write(message + '\n');
  console.log(message);
}

function calculateNewRate() {
  logMessage('-----------------------------------------');
  logMessage('request time:', new Date());
  return axios({
    method: 'GET',
    headers: {Authorization: `token ${process.env.TOKEN}`},
    url: 'https://api.github.com/rate_limit'}
  ).then((response) => {
    logMessage('requests remaining:', response.data.rate.remaining, '| next reset:', new Date(response.data.rate.reset * 1000));
    if(previousRemaining) {
      logMessage(`used in last ${checkFrequency}s:`, previousRemaining - response.data.rate.remaining);
      logMessage('requests per second:', ((previousRemaining - response.data.rate.remaining) / checkFrequency))
      logMessage('requests per minute:', ((previousRemaining - response.data.rate.remaining) / checkFrequency) * 60)
    }
    previousRemaining = response.data.rate.remaining;
  });
}

function runRateCalculation() {
  setTimeout(() => {
    calculateNewRate();
    runRateCalculation();
  }, checkFrequency * 1000);
}

  calculateNewRate();
  runRateCalculation();

