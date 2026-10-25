#!/bin/sh
cd "$(dirname "$0")"
OUT=sky-defense.html
{
  echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
  echo '<title>하늘 방어대</title>'
  echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  echo '<link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap" rel="stylesheet">'
  echo '<style>'; cat src/style.css; echo '</style></head><body>'
  cat src/body.html
  echo '<script>'; cat src/data.js src/engine.js src/render.js src/sound.js src/ui.js; echo '</script></body></html>'
} > $OUT
echo "built $OUT ($(wc -c < $OUT) bytes)"
