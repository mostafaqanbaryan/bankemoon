const express = require('express');
const next = require('next');
// const cors = require('cors');

const port = parseInt(process.env.PORT, 10) || 4000;
const dev = process.env.NODE_ENV === process.env.NODE_DEVELOPMENT;
const app = next({ dev });
const handle = app.getRequestHandler();
/* const corsOpt = {
	origin: 'localhost:8000',
	methods: ['GET', 'POST'],
}; */

app.prepare()
	.then(() => {
		const server = express();

		// Security Headers
		/* server.use(cors(corsOpt));
		server.use((req, res, next) => {
			res.header('Strict-Transport-Security', 'max-age=15552000');
			res.header('Content-Security-Policy', "default-src * data: blob:;script-src localhost:3000 *.jquery.com 'unsafe-inline'; style-src data: blob: 'unsafe-inline' *; connect-src localhost:*");
			next();
		}); */


		const robotsOptions = {
			root: __dirname + '/static/',
			headers: {
				'Content-Type': 'text/plain;charset=UTF-8',
			}
		};
		server.get('/robots.txt', (req, res) => (
			res.status(200).sendFile('robots.txt', robotsOptions)
		));

		const sitemapOptions = {
			root: __dirname + '/static/',
			headers: {
				'Content-Type': 'text/xml;charset=UTF-8',
			}
		};
		server.get('/sitemap.xml', (req, res) => (
			res.status(200).sendFile('sitemap.xml', sitemapOptions)
		));

		const faviconOptions = {
			root: __dirname + '/../cdn/'
		};
		server.get('/sw.js', (req, res) => (
			res.status(200).sendFile('sw.js', faviconOptions)
		));
		server.get('/favicon.ico', (req, res) => (
			res.status(200).sendFile('favicon.ico', faviconOptions)
		));
		server.get('/favicon-16x16.png', (req, res) => (
			res.status(200).sendFile('favicon-16x16.png', faviconOptions)
		));
		server.get('/favicon-32x32.png', (req, res) => (
			res.status(200).sendFile('favicon-32x32.png', faviconOptions)
		));
		server.get('/apple-touch-icon.png', (req, res) => (
			res.status(200).sendFile('apple-touch-icon.png', faviconOptions)
		));
		server.get('/safari-pinned-tab.svg', (req, res) => (
			res.status(200).sendFile('safari-pinned-tab.svg', faviconOptions)
		));
		server.get('/android-chrome-192x192.png', (req, res) => (
			res.status(200).sendFile('android-chrome-192x192.png', faviconOptions)
		));
		server.get('/android-chrome-512x512.png', (req, res) => (
			res.status(200).sendFile('android-chrome-512x512.png', faviconOptions)
		));
		server.get('/browserconfig.xml', (req, res) => (
			res.status(200).sendFile('browserconfig.xml', faviconOptions)
		));
		server.get('/og-image.jpg', (req, res) => (
			res.status(200).sendFile('og-image.jpg', faviconOptions)
		));


		server.get('/terms', (req, res) => {
			return app.render(req, res, '/terms', req.query);
		});

		server.get('/policy', (req, res) => {
			return app.render(req, res, '/policy', req.query);
		});

		server.get('/contact', (req, res) => {
			return app.render(req, res, '/contact', req.query);
		});

		server.get('/about', (req, res) => {
			return app.render(req, res, '/about', req.query);
		});

		server.get('/banks', (req, res) => {
			if(req.query.secret && req.query.secret === process.env.BANKS_SECRET)
				return app.render(req, res, '/banks', req.query);
			return app.render(req, res, '/banks');
		});

		server.get('/blog/:typeName', (req, res) => {
			return app.render(req, res, '/blog', {
				typeName: req.params.typeName,
				page: 1
			});
		});

		server.get('/blog/:typeName/page/:page', (req, res) => {
			return app.render(req, res, '/blog', {
				typeName: req.params.typeName,
				page: req.params.page
			});
		});

		server.get('/blog/:typeName/:postName', (req, res) => {
			return app.render(req, res, '/single', {
				typeName: req.params.typeName,
				postName: req.params.postName
			});
		});

		server.get('*', (req, res) => {
			return handle(req, res);
		});

		server.listen(port, (err) => {
			if (err) throw err;
			console.log(`> Ready on http://localhost:${port}`);
		});
	});
