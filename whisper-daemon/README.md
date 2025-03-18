# Whisper Daemon

A background daemon that listens for global hotkeys and pastes text into the currently focused application.

## Features

- Runs in the background with minimal UI
- Listens for the `Ctrl+Alt+W` global hotkey
- When triggered, pastes a predefined text into the currently focused application

## Requirements

- Windows OS
- Rust toolchain (rustc, cargo)

## Building

```bash
# Clone the repository
git clone https://github.com/yourusername/whisper-daemon.git
cd whisper-daemon

# Build the release version
cargo build --release

# The executable will be in target/release/whisper-daemon.exe
```

## Usage

1. Run the application
2. It will start running in the background (with a console window showing status)
3. Press `Ctrl+Alt+W` in any application to paste the predefined text
4. To quit, return to the console window and press `Ctrl+C`

## Customization

You can modify the source code to:
- Change the hotkey combination
- Customize the text that gets pasted
- Add additional functionality like voice recognition integration

## Future Improvements

- Create a system tray icon instead of console window
- Add a configuration file for customizing hotkeys and text
- Implement actual voice recognition integration 