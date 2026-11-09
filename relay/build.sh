#!/bin/sh
# Erzeugt relay/worker.js aus der Spiel-Logik in bomber-arena.html (Engine + Room) und relay/worker-main.js.
cd "$(dirname "$0")"
{ echo "// Automatisch erzeugt von relay/build.sh aus bomber-arena.html. Nicht von Hand bearbeiten."
  sed -n '/^\/\/ Source: engine.mjs/,/^\/\/ Source: network.mjs/p' ../bomber-arena.html | sed '$d'
  cat worker-main.js; } > worker.js
