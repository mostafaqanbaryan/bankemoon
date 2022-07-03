import API from 'api';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import FormValidation from 'components/formvalidation';
import Captcha from 'components/captcha';
import Loading from 'components/loading/button';

const styles = theme => {
	const width = 600;
	return {
		msgText: {
			color: '#fff',
		},
		msgHolder: {
			textAlign: 'center',
			padding: theme.spacing.unit,
		},
		card: {
			padding: theme.spacing.unit * 2,
			background: 'rgba(255, 255, 255, 0.7)',
		},
		cardSuccess: {
			background: theme.colors.success.background(0.9),
		},
		cardError: {
			background: theme.colors.error.background(0.9),
			// animation: 'errorBg 2s ease-in',
		},
		btnLogin: {
			// marginTop: 20,
			height: 50,
			background: theme.colors.primary(0.8),
			'&:hover': {
				background: theme.colors.primary(1)
			}
		},
		textLeft: {
			fontFamily: theme.fonts.en,
			textAlign: 'left',
			direction: 'ltr',
		},
		textWidth: {
			width: 175,
			marginLeft: theme.spacing.unit,
			[`@media (max-width: ${width}px)`]: {
				width: '100%',
				marginLeft: 0
			}
		},
		link: {
			color: '#eee',
			textDecoration: 'none',
			transition: 'color 0.2s',
			'&:hover': {
				color: '#687678',
			},
			'&:focus': {
				color: '#687678',
			},
			'&:active': {
				color: '#889698',
			}
		},
		login: {
			height: 'auto',
			color: '#59f',
			'&:hover': {
				color: '#38d',
			},
			'&:focus': {
				color: '#38d',
			},
			'&:active': {
				color: '#7bf',
			},
			[`@media (max-width: ${width}px)`]: {
				display: 'block',
				textAlign: 'center',
				height: 35,
				float: 'none',
				clear: 'both',
			}
		},
		forgot: {
			height: 'auto',
			float: 'left',
			[`@media (max-width: ${width}px)`]: {
				height: 35,
				display: 'block',
				textAlign: 'center',
				float: 'none',
				clear: 'both',
			}
		},
		footer: {
			fontSize: '0.7rem',
			padding: theme.spacing.unit * 2,
			paddingTop: theme.spacing.unit,
			background: 'rgba(0, 0, 0, 0.7)',
			borderRadius: '0 0 5px 5px'
		}
}};

class Register extends Component{
	state = {
		error: null,
		success: null,
		loading: false,
	};

	handleChange = e => {
		if(this.state.error)
			this.setState({ error: null});
		if(this.state.success)
			this.setState({ success: null});
	};

	handleRegister = e => {
		this.setState({ loading: true });
		const key = 'register';
		const formData = new FormData(e.target);
		const phone = formData.get('phoneNumber');
		const url = `/auth/${key}`;
		const cb = {
			error: result => {
				this.props.createCaptcha();
				if(this.captchaValueInput) {
					this.captchaValueInput.value = null;
					this.captchaValueInput.focus();
				}
				this.setState({
					success: null,
					error: result.message,
					loading: false,
				});
			},
			limited: result => this.props.handleLimited(result),
			succeed: result => {
				window.sessionStorage.setItem('phoneNumber', phone);
				this.setState({
					success: "کد فعالسازی به موبایل شما ارسال شد",
					error: null,
					loading: false,
				});
				setTimeout(() => this.props.history.push('/auth/reset-password/'), 1000);
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount(){
		this.props.setMinHeight({large: 500, small: 800});
		this.props.setCaption('ثبت‌نام در سامانه');
		this.API = new API();
	};

	componentWillUnmount(){
		this.API.cancel();
	};

	render(){
		const {
			classes,
			isLowHeight,
			captcha,
			createCaptcha,
		} = this.props;

		const {
			success,
			error,
			loading,
		} = this.state;

		const base = '/auth';
		return(
			<section>
				<Card className={classNames(
					classes.card,
					error ? classes.cardError : '',
					success ? classes.cardSuccess: ''
				)} elevation={0}>
					<FormValidation
						onSubmit={this.handleRegister}
						onChange={this.handleChange}
						autoComplete="off">
						<TextField
							type="text"
							label="نام"
							name="firstName"
							helperText='نام را به صورت فارسی وارد کنید'
							fullWidth={isLowHeight}
							required
							autoFocus
							className={isLowHeight ? "" : classes.textWidth}
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 1,
								pattern: "^[ضصثقفغعهخحجچشسیبلاتنمکگپظطزرذدئوژآ‌\\s]+$",
								autoComplete:'off'}}
						/>
						<TextField
							type="text"
							label="نام خانوادگی"
							name="lastName"
							helperText='نام خانوادگی باید فارسی باشد'
							fullWidth={isLowHeight}
							required
							className={isLowHeight ? "" : classes.textWidth}
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 2,
								pattern: "^[ضصثقفغعهخحجچشسیبلاتنمکگپظطزرذدئوژآ‌\\s]+$",
								autoComplete:'off'}}
						/>
						<TextField
							type="phone"
							label="تلفن همراه"
							name="phoneNumber"
							helperText='شماره را به صورت 11 رقمی وارد کنید'
							fullWidth
							required
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 3,
								className: classes.textLeft,
								pattern:'09\\d{9}',
								maxLength: 11,
								autoComplete:'off'}}
						/>
						<Captcha
							tabIndex={5}
							createCaptcha={createCaptcha}
							captcha={captcha}
							name='captchaValue'
							helperText
						/>
						{(error || success) &&
							<div className={classes.msgHolder}>
								{error &&
									<Typography className={classes.msgText}>{error}</Typography>
								}
								{success &&
									<Typography className={classes.msgText}>{success}</Typography>
								}
							</div>
						}
						<Typography variant='caption' style={{ textAlign: 'center', marginBottom: 8 }}>
							عضویت شما به منزله مطالعه و تایید <a href='/terms/' style={{ textDecoration: 'none', color: 'teal' }}>قوانین و مقررات بانکمون</a> است
						</Typography>
						<Button
							className={classes.btnLogin}
							variant="raised"
							fullWidth
							disabled={loading || (success && success.length > 0)}
							tabIndex={7}
							type='submit'
							color="primary">
							عضویت
							<Loading
								color='#ddd'
								show={loading} />
							</Button>
					</FormValidation>
				</Card>
				<div className={classes.footer}>
					<Link className={classNames(classes.link, classes.login)} to={`${base}/`}>ورود به سامانه</Link>
					<Link className={classNames(classes.link, classes.forgot)} to={`${base}/forgot-password/`}>فراموش کردن رمز عبور</Link>
				</div>
			</section>
		);
	}
}

export default withStyles(styles)(Register);
