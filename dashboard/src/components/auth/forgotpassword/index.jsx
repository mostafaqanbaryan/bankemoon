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
import Loading from 'components/loading/button';
import Captcha from 'components/captcha';

const styles = theme => {
	const width = 400;
	return {
		msgText: {
			color: '#fff',
		},
		msgLoading: {
			margin: '0 auto',
			marginTop: 10,
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
			float: 'left',
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
				height: 35,
				display: 'block',
				textAlign: 'center',
				float: 'none',
				clear: 'both',
			}
		},
		register: {
			height: 'auto',
			color: '#4f6',
			'&:hover': {
				color: '#2c4',
			},
			'&:focus': {
				color: '#2c4',
			},
			'&:active': {
				color: '#5f7',
			},
			[`@media (max-width: ${width}px)`]: {
				display: 'block',
				textAlign: 'center',
				height: 35,
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

class ForgotPassword extends Component{
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

	handleForgot = e => {
		this.setState({ loading: true });
		const key = 'forgot-password';
		const formData = new FormData(e.target);
		const phone = formData.get('phoneNumber');
		const url = `/auth/${key}`;
		const cb = {
			error: result => {
				this.props.createCaptcha();
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
				setTimeout(() => this.props.history.push('/auth/reset-password/'), 2000);
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount(){
		this.props.setMinHeight({large: 400, small: 500});
		this.props.setCaption('بازیابی رمز عبور');
		this.API = new API();
	};

	componentWillUnmount(){
		this.API.cancel();
	};

	render(){
		const {
			classes,
			captcha,
			createCaptcha,
		} = this.props;

		const {
			error,
			success,
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
						onChange={this.handleChange}
						onSubmit={this.handleForgot}
						autoComplete="off">
						<TextField
							type="phone"
							label="شماره موبایل"
							name="phoneNumber"
							fullWidth
							helperText='شماره را به صورت 11 رقمی وارد کنید'
							required
							autoFocus
							margin='normal'
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 1,
								className: classes.textLeft,
								pattern:'09\\d{9}',
								maxLength: 11,
								autoComplete:'off'
							}}
						/>
						<Captcha
							createCaptcha={createCaptcha}
							captcha={captcha}
							tabIndex={2}
							name='captchaValue'
							helperText
						/>
						<div className={classes.msgHolder}>
							{error &&
								<Typography className={classes.msgText}>{error}</Typography>
							}
							{success &&
								<div>
									<Typography className={classes.msgText}>{success}</Typography>
									<Loading className={classes.msgLoading} color='#eee' show={true}/>
								</div>
							}
						</div>
						<Button
							tabIndex={3}
							className={classes.btnLogin}
							variant="raised"
							fullWidth
							disabled={loading || (success && success.length > 0)}
							type='submit'
							color="primary">
							ارسال
							<Loading
								color='#ddd'
								show={loading} />
						</Button>
					</FormValidation>
				</Card>
				<div className={classes.footer}>
					<Link className={classNames(classes.link, classes.login)} to={`${base}/`}>ورود به سامانه</Link>
					<Link className={classNames(classes.link, classes.register)} to={`${base}/register/`}>ثبت‌نام در سامانه بانکمون</Link>
				</div>
			</section>
		);
	}
}

export default withStyles(styles)(ForgotPassword);

