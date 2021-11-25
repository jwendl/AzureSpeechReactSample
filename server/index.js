require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const https = require('https');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(cors());

const options = {
    key: fs.readFileSync('certificates/server_key'),
    cert: fs.readFileSync('certificates/server_cert'),
    ca: fs.readFileSync('certificates/server_cert'),
    requestCert: true,                
    rejectUnauthorized: false
};

app.get('/api/get-speech-token', async (req, res, next) => {
    if (!req.client.authorized) {
        return res.status(401).send('Device is not authorized');
    }

    const certificate = req.socket.getPeerCertificate();
    if (certificate.subject) {
        console.log(`Common Name: ${certificate.subject.CN}`);
    }

    res.setHeader('Content-Type', 'application/json');
    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

https.createServer(options, app).listen(3001, () => {
    console.log('Express server is running on localhost:3001')
});
