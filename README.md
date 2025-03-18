# Modified Whisper Web for System-Wide Voice Transcription

A modified version of the original Whisper Web project, enhanced to provide system-wide voice-to-text capabilities. This project leverages browser-based ML-powered speech recognition using [🤗 Transformers.js](https://github.com/xenova/transformers.js) and extends it with remote control capabilities and system integration. Designed specifically to work with Stream Deck for seamless AI coding assistant integration.

## Features

- Browser-based speech recognition using Whisper ML model
- Remote control functionality via HTTP POST messages
- Stream Deck integration for hardware button control
- Cross-platform keyboard event integration via Rust
- Alternative to built-in speech recognition (e.g., Windows Key + H on Windows)
- Real-time transcription using browser's recording capabilities
- Machine learning processing happens locally in the browser
- Decoupled architecture for flexibility and application independence

## Use Case: AI Coding Assistant Integration

This project was designed to enhance the experience of using AI coding assistants (like Cursor) by:
- Providing dedicated Stream Deck buttons for voice commands
- Avoiding keyboard shortcut conflicts between applications
- Separating voice control from specific applications for better flexibility
- Enabling hardware-based control for start/stop recording

## System Architecture

This project consists of three main components:

1. **Web Application**: A modified version of the original Whisper Web that handles:
   - Audio recording through the browser
   - ML-powered transcription using Transformers.js
   - HTTP endpoint for remote control
   - WebSocket communication for real-time control

2. **Rust Integration**: A companion application that:
   - Converts transcription output into system keyboard events
   - Provides cross-platform compatibility
   - Enables system-wide integration

3. **Stream Deck Integration**:
   - Dedicated buttons for start/stop recording
   - HTTP POST messages to trigger recording actions
   - Independent control system separate from keyboard shortcuts
   - Configurable buttons for different AI assistant commands

## Control Flow

1. Stream Deck button press → HTTP POST to web server
2. Web server → Browser client communication
3. Browser client → Start/stop recording and transcription
4. Transcription → Rust application for keyboard event simulation
5. Result → Text input in active application

## Installation and Setup

1. Clone the repo and install dependencies:

    ```bash
    git clone [your-repository-url]
    cd whisper-web
    npm install
    ```

2. Build and run the Rust companion application:
    - Instructions for building the Rust application will be in its respective directory

3. Run the web server:

    ```bash
    npm run dev
    ```

4. Open the application in your browser at [http://localhost:5173/](http://localhost:5173/)

5. Configure Stream Deck:
    - Set up buttons for start/stop recording
    - Configure HTTP POST actions to control the web server
    - Optional: Add additional buttons for common AI assistant commands

## Browser Compatibility Notes

- Firefox users need to enable Web Workers support by setting `dom.workers.modules.enabled` to `true` in `about:config`

## Credits

This project is based on the original [Whisper Web](https://github.com/xenova/whisper-web) by Xenova, modified to provide system-wide voice transcription capabilities with Stream Deck integration.
