import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displayText: 'INITIALIZED: ready to test speech...'
        }
    }
    
    async componentDidMount() {
        // check for valid speech key/region
        const tokenRes = await getTokenOrRefresh();
        if (tokenRes.authToken === null) {
            this.setState({
                displayText: 'FATAL_ERROR: ' + tokenRes.error
            });
        }
    }

    async sttFromMic() {
        this.setState({
            displayText: ''
        });

        const authorizationToken = await getTokenOrRefresh();
        const speechConfiguration = speechsdk.SpeechConfig.fromAuthorizationToken(authorizationToken.authToken, authorizationToken.region);
        speechConfiguration.outputFormat = speechsdk.OutputFormat.Detailed;
        speechConfiguration.speechRecognitionLanguage = 'en-US';
        
        // const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const audioConfiguration = speechsdk.AudioConfig.fromMicrophoneInput('{0.0.1.00000000}.{7dce2a65-219b-4a2d-920a-e1bac0531bf0}');
        const speechRecognizer = new speechsdk.SpeechRecognizer(speechConfiguration, audioConfiguration);

        this.setState({
            displayText: 'Speak into your microphone...\n'
        });

        speechRecognizer.recognizing = (sender, eventArgs) => {
            var recognizingMessage = `Recognizing ${eventArgs.result.text}`
            this.setState({
                displayText: `${this.state.displayText}${recognizingMessage}\n`
            });
        };

        speechRecognizer.recognized = (sender, eventArgs) => {
            if (eventArgs.result.reason === speechsdk.ResultReason.NoMatch) {
                var notMatchedMessage = `I didn't recognize the text`;

                this.setState({
                    displayText: `${this.state.displayText}${notMatchedMessage}\n`
                });
            } else {
                var results = JSON.parse(eventArgs.result.json)['NBest'];
                var matchedMessage = `Recognized ${eventArgs.result.text}\n`;
                matchedMessage += `Additional Details\n\n`;

                results.forEach((additionalDetails) => {
                    matchedMessage += `Text ${additionalDetails.Display}\n`;
                    matchedMessage += `Confidence ${additionalDetails.Confidence}\n`;
                    matchedMessage += `LexicalForm ${additionalDetails.Lexical}\n`;
                    matchedMessage += `NormalizedForm ${additionalDetails.ITN}\n`;
                    matchedMessage += `MaskedNormalizedForm ${additionalDetails.MaskedITN}\n`;
                });

                this.setState({
                    displayText: `${this.state.displayText}${matchedMessage}\n`
                });                
            }
        };
        
        speechRecognizer.canceled = (sender, eventArgs) => {
            var cancelledMessage = `Cancelled reason ${eventArgs.reason}`
            this.setState({
                displayText: `${this.state.displayText}${cancelledMessage}\n`
            });
        };

        speechRecognizer.startContinuousRecognitionAsync();
    }

    async fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        this.setState({
            displayText: fileInfo
        });

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = `RECOGNIZED: Text=${result.text}`
            } else {
                displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            this.setState({
                displayText: fileInfo + displayText
            });
        });
    }

    render() {
        return (
            <Container className="app-container">
                <h1 className="display-4 mb-3">Speech sample app</h1>

                <div className="row main-container">
                    <div className="col-6">
                        <i className="fas fa-microphone fa-lg mr-2" onClick={() => this.sttFromMic()}></i>
                        Convert speech to text from your mic.

                        <div className="mt-2">
                            <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg mr-2"></i></label>
                            <input 
                                type="file" 
                                id="audio-file" 
                                onChange={(e) => this.fileChange(e)} 
                                style={{display: "none"}} 
                            />
                            Convert speech to text from an audio file.
                        </div>
                    </div>
                    <div className="col-6">
                        <textarea rows="25" cols="100" className="output-display rounded" value={this.state.displayText}>
                        </textarea>
                    </div>
                </div>
            </Container>
        );
    }
}
