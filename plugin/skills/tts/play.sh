#!/bin/bash
# GM Arcanum TTS — shared cross-platform audio playback
# Source this file from tts.sh / replay.sh and call: play_audio "/path/to/file.mp3"
#
# Detects OS and picks an available player. Linux fallback order:
#   mpv → ffplay → mpg123 → cvlc → play (sox)
# Mac uses afplay (built-in). Windows (Git Bash / Cygwin / MSYS) uses PowerShell.

play_audio() {
    local file="$1"
    local os
    os="$(uname -s)"

    case "$os" in
        Linux)
            if command -v mpv > /dev/null 2>&1; then
                mpv --no-terminal --really-quiet --no-video "$file"
            elif command -v ffplay > /dev/null 2>&1; then
                ffplay -nodisp -autoexit -loglevel quiet "$file"
            elif command -v mpg123 > /dev/null 2>&1; then
                mpg123 -q "$file"
            elif command -v cvlc > /dev/null 2>&1; then
                cvlc --play-and-exit --quiet --no-video --intf dummy "$file" 2>/dev/null
            elif command -v play > /dev/null 2>&1; then
                play -q "$file"
            else
                echo "ERROR: No supported audio player found." >&2
                echo "Install one of: mpv, ffmpeg (for ffplay), mpg123, vlc (for cvlc), or sox (for play)." >&2
                return 1
            fi
            ;;
        Darwin)
            if command -v afplay > /dev/null 2>&1; then
                afplay "$file"
            else
                echo "ERROR: afplay not found (should be built into macOS)." >&2
                return 1
            fi
            ;;
        MINGW*|CYGWIN*|MSYS*)
            local win_path
            win_path=$(cygpath -w "$file" 2>/dev/null || echo "$file")
            powershell.exe -NoProfile -Command "
                Add-Type -AssemblyName PresentationCore
                \$p = New-Object System.Windows.Media.MediaPlayer
                \$p.Open([uri]'$win_path')
                Start-Sleep -Milliseconds 500
                \$p.Play()
                while (-not \$p.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 200 }
                while (\$p.Position -lt \$p.NaturalDuration.TimeSpan) { Start-Sleep -Seconds 1 }
                \$p.Close()
            " 2>/dev/null
            ;;
        *)
            echo "ERROR: Unsupported OS: $os" >&2
            return 1
            ;;
    esac
}
