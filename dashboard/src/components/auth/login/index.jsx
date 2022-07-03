import API from 'api';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
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
				background: theme.colors.primary(1),
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

class Login extends Component{
	getRememberMe = () => window.localStorage.getItem('rememberMe') === 'true';

	state = {
		rememberMe: this.getRememberMe(),
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


	handleRememberMe = e => {
		// const rM = e.target.checked;
		// const rM = this.getRememberMe();
		this.setState(prev => {
			window.localStorage.setItem('rememberMe', !prev.rememberMe);
			return ({ rememberMe: !prev.rememberMe });
		});
	};

	handleLogin = e => {
		this.setState({ loading: true });
		const key = 'login';
		const formData = new FormData(e.target);
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
				if(this.state.rememberMe){
					window.localStorage.setItem('userId', result.data.user_id);
					window.localStorage.setItem('sessionId', result.data.session_id);
				}else{
					window.sessionStorage.setItem('userId', result.data.user_id);
					window.sessionStorage.setItem('sessionId', result.data.session_id);
				}
				this.setState({
					success: "خوش آمدید؛ درحال انتقال به سامانه...",
					error: null,
					loading: false,
				});
				setTimeout(() => {
					this.props.getSession();
					// this.props.history.push('/');
				}, 1000);
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount(){
		this.props.setMinHeight({large: 500, small: 500});
		this.props.setCaption('ورود به سامانه');
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
			rememberMe,
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
						onSubmit={this.handleLogin}
						autoComplete="off">
						<TextField
							type="text"
							label="شماره تلفن همراه"
							name="phoneNumber"
							fullWidth
							helperText='شماره تلفن را به صورت 11 رقمی وارد کنید'
							required
							autoFocus
							InputProps={{autoComplete:'off'}}
							inputProps={{
								className: classes.textLeft,
								pattern:'09\\d{9}',
								autoComplete:'off',
								maxLength: 11,
								tabIndex: 1}}
						/>
						<TextField
							type="password"
							label="رمز عبور"
							name="password"
							fullWidth
							helperText='رمز عبور را به صورت صحیح وارد کنید'
							required
							inputProps={{
								className: classes.textLeft,
								tabIndex: 2,
								autoComplete:'off',
							}}
							InputProps={{
								autoComplete:'off',
								endAdornment: 
									<InputAdornment style={{direction: 'ltr'}} position='end'>
										<Tooltip title="رمزت یادم بمونه؟">
											<Switch
												id="rememberMe"
												name="rememberMe"
												checked={rememberMe}
												onChange={this.handleRememberMe}
												tabIndex={5}
											/>
										</Tooltip>
									</InputAdornment>
							}}
						/>
						<Captcha
							tabIndex={3}
							createCaptcha={createCaptcha}
							captcha={captcha}
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
						<div style={{ textAlign: 'center', paddingBottom: 8, fontSize: '0.8rem', fontWeight: 500, }}>
							<Link to='/auth/reset-password/' style={{ textDecoration: 'none', textShadow: '0 0 2px #aaa', color: 'teal' }}>
								کد فعالسازی برای شما ارسال شده؟ کلیک کنید
							</Link>
						</div>
						<Button
							className={classes.btnLogin}
							variant="raised"
							fullWidth
							tabIndex={4}
							disabled={loading || (success && success.length > 0)}
							type='submit'
							color="primary">
							ورود
							<Loading
								color='#ddd'
								show={loading} />
							</Button>
					</FormValidation>
				</Card>
				<div className={classes.footer}>
					<Link className={classNames(classes.link, classes.register)} to={`${base}/register/`}>ثبت‌نام در سامانه بانکمون</Link>
					<Link className={classNames(classes.link, classes.forgot)} to={`${base}/forgot-password/`}>فراموش کردن رمز عبور</Link>
				</div>
			</section>
		);
	}
}

export default withStyles(styles)(Login);
