const http = require('http');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');

// reading the appropriate .env file 
if (process.env.NODE_ENV === 'test') {
    console.log('test');
    require('dotenv').config({path:__dirname + '/.test_env'});
}{
    console.log('default');
    require('dotenv').config();
}
// checking if the environment variables have been loaded
const requiredEnv = [
    'GET_NEW_PIC',
    'NODE_ENV',
    'PORT',
    'ALLOWED_ORIGINS',
    'DOG_URL'
];

const unsetEnv = requiredEnv.filter((envVar) => !(typeof process.env[envVar] !== 'undefined'));

if (unsetEnv.length > 0) {
    console.error('Required ENV variables are not set: [' + unsetEnv.join(', ') + ']');
}
//
const app = express();
app.use(cors());
app.options('*', cors());
app.use(helmet());

startTheServer()

app.use(require('./routes'));

function startTheServer(){
    const port = process.env.PORT;
    let server = null;
    server = http.createServer(app);
    server.listen(process.env.PORT);
    console.log('Parser is running at http://localhost:',process.env.PORT,'/');
    console.log('In ',process.env.NODE_ENV,' mode.');
}

module.exports = app;