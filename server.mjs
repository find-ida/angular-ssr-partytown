import express from 'express';
import { join } from "node:path";
import { createProxyMiddleware } from "http-proxy-middleware";

const serverPort = process.env.PORT || 4000;

const LOCALES = ['en'];

async function run() {
  const server = express();

  // load angular server into express
  for (const locale of LOCALES) {
    const serverPath = join(process.cwd(), `dist`, 'angular-ssr-partytown', `server`, locale, 'server.mjs');
    const ngServer = await import(serverPath);
    server.use(`/${locale}/`, ngServer.app());
  }

  addGoogleTagReverseProxy(server);
  addPartyTownReverseProxy(server);

  server.get('/', (req, res) => {
    res.redirect(301, `/${getLanguage(req)}/`);
  });

  server.get('*', (req, res) => {
    res.redirect(301, `/${getLanguage(req)}${req.url}`);
  });

  server.listen(serverPort, () => {
    console.log(`Node Express server listening on http://localhost:${serverPort}`);
  });
}

function addGoogleTagReverseProxy(server) {
  server.use('/gtm', (req, res, next) => {
    const {url} = req.query;
    if (!url) {
      res.status(400).send('Missing url parameter');
      return;
    }
    const gtmUrl = new URL(url);
    const proxy = createProxyMiddleware({
      target: gtmUrl.origin,
      changeOrigin: true,
      pathRewrite: () => gtmUrl.pathname + gtmUrl.search,
      // logLevel: 'silent'
    });
    proxy(req, res, next);
  });
}

function getLanguage(req) {
  return LOCALES[0];
}

run();
