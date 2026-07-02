const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = 'https://ptu-gen.sewef.workers.dev';
const REDIRECT_DELAY_MS = 5000;

app.use((req, res) => {
  const redirectDelayMs = Math.max(1000, REDIRECT_DELAY_MS);
  const redirectDelaySec = Math.ceil(redirectDelayMs / 1000);

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redirecting</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: radial-gradient(circle at 30% 20%, #f4fbff, #e8eef9 55%, #dde6f5 100%);
        color: #0f172a;
      }
      .card {
        width: min(92vw, 580px);
        padding: 28px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 14px 36px rgba(15, 23, 42, 0.12);
        text-align: center;
      }
      h1 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1.35rem;
      }
      p {
        margin: 8px 0;
        line-height: 1.5;
      }
      a {
        color: #0057b8;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Redirect in progress</h1>
      <p>This service has moved to a new address.</p>
      <p>You will be redirected automatically in a few moments.</p>
      <p>If nothing happens, open this link:</p>
      <p><a href="${TARGET_URL}">${TARGET_URL}</a></p>
    </main>
    <script>
      setTimeout(function () {
        window.location.replace(${JSON.stringify(TARGET_URL)});
      }, ${redirectDelayMs});
    </script>
    <noscript>
      <meta http-equiv="refresh" content="${redirectDelaySec};url=${TARGET_URL}">
    </noscript>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Redirect service running on port ${PORT}`);
});
