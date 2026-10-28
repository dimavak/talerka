# Tesseract.js для распазнавання чэкаў на прыладзе

Файлы ляжаць у рэпазіторыі, каб фота чэка распазнавалася без сервера і без старонніх CDN,
а аплікацыя заставалася наборам статычных файлаў, які можна перанесці на любы хостынг.

| Файл | Адкуль | Ліцэнзія |
|---|---|---|
| `tesseract.min.js`, `worker.min.js` | npm `tesseract.js@5.1.1` (`dist/`) | Apache-2.0 (`LICENSE`) |
| `core/tesseract-core-simd-lstm.wasm.js`, `core/tesseract-core-lstm.wasm.js` | npm `tesseract.js-core@5.1.1` | Apache-2.0 |
| `lang/pol.traineddata.gz` | npm `@tesseract.js-data/pol` (`4.0.0_best_int`), мадэль з tesseract-ocr/tessdata | Apache-2.0 |

Абнаўленне: `npm pack` тых жа пакетаў і замена файлаў з тымі ж імёнамі.
