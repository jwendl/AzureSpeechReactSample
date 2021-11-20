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
            displayText: 'speak into your microphone...\n'
        });

        // recognizer.recognizeOnceAsync(result => {
        //     let displayText;
        //     if (result.reason === ResultReason.RecognizedSpeech) {
        //         displayText = `RECOGNIZED: Text=${result.text}`
        //     } else {
        //         displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
        //     }

        //     this.setState({
        //         displayText: displayText
        //     });
        // });

        speechRecognizer.recognizing = (sender, eventArgs) => {
            let message;
            message = `Recognizing ${eventArgs.result.text}`
            this.setState({
                displayText: `${this.state.displayText}${message}\n`
            });
        };

        speechRecognizer.canceled = (sender, eventArgs) => {
            let message;
            message = `Cancelled reason ${eventArgs.reason}`
            this.setState({
                displayText: `${this.state.displayText}${message}\n`
            });
        };

        speechRecognizer.recognized = (sender, eventArgs) => {
            let message;
            if (eventArgs.result.reason === speechsdk.ResultReason.NoMatch) {
                message = `I didn't recognize the text`;
            } else {
                message = `Recognized ${eventArgs.result.text}\n`;
                message += `Additional Details\n\n`;
                eventArgs.result.best().forEach((additionalDetails) => {
                    message += `Text ${additionalDetails.text}\n`;
                    message += `Confidence ${additionalDetails.confidence}\n`;
                    message += `LexicalForm ${additionalDetails.lexicalForm}\n`;
                    message += `NormalizedForm ${additionalDetails.normalizedForm}\n`;
                    message += `MaskedNormalizedForm ${additionalDetails.maskedNormalizedForm}\n`;
                });
            }

            this.setState({
                displayText: `${this.state.displayText}${message}\n`
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
