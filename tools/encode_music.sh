#!/usr/bin/env bash
# Encode a music file into audio/<name>.mp3 for the streamed-music layer in js/audio.js.
#
#   tools/encode_music.sh ~/Downloads/some-track.mp3 pallet
#
# Two-pass EBU R128 loudness normalisation to TARGET_LUFS so every track sits at
# the same level in game and they can all share one `trim` in STREAMS.
set -euo pipefail
SRC=${1:?usage: encode_music.sh <source-audio> <name>}
NAME=${2:?usage: encode_music.sh <source-audio> <name>}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/audio/$NAME.mp3"
TARGET_LUFS=-18
TARGET_TP=-1.5
TARGET_LRA=11
BITRATE=${BITRATE:-112k}

mkdir -p "$ROOT/audio"
echo "measuring $SRC ..."
STATS=$(ffmpeg -hide_banner -nostats -i "$SRC" \
  -af "loudnorm=I=$TARGET_LUFS:TP=$TARGET_TP:LRA=$TARGET_LRA:print_format=json" -f null - 2>&1 \
  | sed -n '/^{/,/^}/p')
get() { printf '%s' "$STATS" | grep "\"$1\"" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/'; }
I=$(get input_i); TP=$(get input_tp); LRA=$(get input_lra); THRESH=$(get input_thresh); OFF=$(get target_offset)

echo "encoding -> audio/$NAME.mp3 (${BITRATE}, ${TARGET_LUFS} LUFS)"
ffmpeg -v error -y -i "$SRC" -map 0:a:0 -map_metadata -1 \
  -af "loudnorm=I=$TARGET_LUFS:TP=$TARGET_TP:LRA=$TARGET_LRA:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$THRESH:offset=$OFF:linear=true,aresample=44100" \
  -c:a libmp3lame -b:a "$BITRATE" -ar 44100 -ac 2 "$OUT"

ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128 -f null - 2>&1 | grep -A1 'Integrated loudness:' | tail -1 | sed "s|^|audio/$NAME.mp3 |"
ls -lh "$OUT" | awk '{print "  size:", $5}'
