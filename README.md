# Time Server - 24 Hour Music Player

A web application for managing and playing 24 one-hour music files, designed to run on a Raspberry Pi.

## Features

- Upload and manage 24 music files
- Rearrange playback order
- Web interface for control
- VLC integration for playback

## Setup

1. Install dependencies:

   ```bash
   npm install
   cd client
   npm install
   ```

2. Start the development server:
   ```bash
   # In the root directory
   npm run dev:all
   ```

## Project Structure

- `/server.js` - Express backend server
- `/client/` - React frontend application
- `/uploads/` - Directory for stored music files

## Requirements

- Node.js
- VLC media player
- Raspberry Pi (for deployment)

## Notes

- Maximum file size for uploads: 500MB
- Supported audio formats: MP3, WAV, OGG
- Files should be approximately 1 hour in length
