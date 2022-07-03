const nodeMailer		= require("nodemailer");
const EmailTemplates = require('email-templates');
// const sender = encodeURIComponent(process.env.EMAIL_USER);
const USER = process.env.EMAIL_USER;
const PASSWD = process.env.EMAIL_PASSWD;

const smtpConfig = {
	host: 'mail.appist.ir',
	secure: false, // upgrade later with STARTTLS
	auth: {
		user: USER,
		pass: PASSWD,
	},
	tls: {
		rejectUnauthorized: false
	},
};
let transporter = nodeMailer.createTransport(smtpConfig);

const emailTemplates = new EmailTemplates({
	message: {
		from: {
			address: USER,
			name: 'بانکمون',
		}
	},
	// send: true,
	// preview: false,
	transport: smtpConfig,
	views: {
		root: 'Email',
		options: {
			extension: 'ejs'
		}
	}
});

/* exports.sendPasswordReset = (user, key) => {
	const subject = 'بازیابی رمز عبور';
	return emailTemplates
		.send({
			template: 'templates',
			message: {
				subject,
				to: {
					address: user.email,
					name: user.first_name + ' ' + user.last_name,
				}
			},
			locals: {
				subject,
				name: user.first_name + ' ' + user.last_name,
				content: [
					'برای حساب شما درخواست رمز عبور شده است',
					'درصورتی که شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید',
					'در غیر این صورت، روی لینک زیر کلیک کرده و رمز عبور جدید را تعیین کنید',
					'',
					`https://bankemoon.com/auth/reset-password/?uid=${user.id}&key=${key}`
				]
			}
		});
}; */

exports.activation = (user, email, key) => {
	const subject = 'فعالسازی ایمیل';
	return emailTemplates
		.send({
			template: 'templates',
			message: {
				subject,
				to: {
					address: user.email,
					name: user.first_name + ' ' + user.last_name,
				}
			},
			locals: {
				subject,
				name: user.first_name + ' ' + user.last_name,
				content: [
					'این ایمیل برای حساب شما در بانکمون وارد شده است',
					'جهت فعالسازی ایمیل خود از کد زیر استفاده کنید',
					'درصورتی که شما این ایمیل را ثبت نکرده‌اید، این ایمیل را نادیده بگیرید',
					'',
					`<p style="text-align: center; font-size: 1.3rem">${key}</p>`
				]
			}
		});
};
