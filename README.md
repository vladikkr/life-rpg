# Сайт Life RPG

Лендинг приложения. Обычный статический сайт: `index.html`, `style.css`, `main.js`, `assets/logo.svg`. Сборка не нужна.

## Как включить скачивание

1. Положи APK в папку `downloads/`, например `downloads/life-rpg-1.0.0.apk`.
2. Открой `main.js` и впиши путь в самом верху:

   ```js
   const DOWNLOAD = {
     apk: "downloads/life-rpg-1.0.0.apk",
     play: "", // сюда ссылку на Google Play, когда появится
   };
   ```

Пока ссылка пустая, кнопка серая и показывает подсказку «Скоро».

## Как посмотреть локально

```bash
python -m http.server 5178 --directory website
```

Затем открой http://localhost:5178

## Как выложить в интернет

Подойдёт любой бесплатный статический хостинг: GitHub Pages, Netlify (перетащить папку `website` на app.netlify.com/drop), Cloudflare Pages или Vercel.
