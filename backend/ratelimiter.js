const RateLimit		= require('express-rate-limit');


limitHandler = (req, res) => {
	res.status(429).json({
		status: 'limited',
		message: req.limitMessage,
	});
};

rateLimiter = app =>{
	// app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
	let captchaLimiter = new RateLimit({
		windowMs: 1 * 1000,
		max: 1,
		// delayAfter: 2,
		// delayMs: 1*1000,
		handler: limitHandler
	});
	let registerLimiter = new RateLimit({
		windowMs: 1 * 60 * 1000,
		max: 2,
		delayMs: 0,
		handler: limitHandler
	});
	let loginLimiter = new RateLimit({
		windowMs: 5 * 60 * 1000,
		max: 5,
		delayAfter: 2,
		delayMs: 2*1000,
		handler: limitHandler
	});
	let appLimiter = new RateLimit({
		windowMs: 15 * 60 * 1000,
		max: 100,
		delayMs: 0,
		handler: limitHandler
	});

	// Access to headers from browser
	app.use((req, res, next) => {
		res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
		next();
	});

	app.use('/contact', (req, res, next) => {
		req.limitMessage = 'لطفا خونسرد باشید!';
		res.setHeader('Retry-After', 1);
		next();
	});
	app.use('/captcha', (req, res, next) => {
		req.limitMessage = 'لطفا خونسرد باشید!';
		res.setHeader('Retry-After', 2);
		next();
	});
	app.use('/users/login', (req, res, next) => {
		req.limitMessage = 'تلاش شما برای ورود از حد مجاز بیشتر شده است؛ لطفا چند دقیقه منتظر بمانید';
		res.setHeader('Retry-After', 270);
		next();
	});
	app.use('/users/activation', (req, res, next) => {
		req.limitMessage = 'تلاش شما برای ثبت از حد مجاز بیشتر شده است؛ لطفا چند دقیقه منتظر بمانید';
		res.setHeader('Retry-After', 270);
		next();
	});
	app.use('/users/register', (req, res, next) => {
		req.limitMessage = 'هر دقیقه امکان ساختن دو اکانت از یک آی‌پی وجود دارد؛ چند لحظه‌ی دیگر تلاش کنید';
		res.setHeader('Retry-After', 50);
		next();
	});
	app.use('/users/forgot-password', (req, res, next) => {
		req.limitMessage = 'هر دقیقه امکان ساختن دو اکانت از یک آی‌پی وجود دارد؛ چند لحظه‌ی دیگر تلاش کنید';
		res.setHeader('Retry-After', 50);
		next();
	});

	app.use('/contact', registerLimiter);
	app.use('/captcha', captchaLimiter);
	app.use('/users/login', loginLimiter);
	app.use('/users/register', registerLimiter);
	app.use('/users/forgot', registerLimiter);

	return app;
};

module.exports = rateLimiter;
