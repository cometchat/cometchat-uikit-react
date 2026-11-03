# v7.2.5

## New
- None

## Enhancements
- None

## Fixes
- Fixed voice notes recorded on the web not playing on iOS and showing 0:00 on mobile; they're now sent as WAV with their length in `audioDuration` metadata.
- Fixed replies sent as voice notes losing their quote and showing "Edited" after the Voice Transcription extension processed them.
- Fixed polls created as replies not quoting the message and leaving the reply preview open.
