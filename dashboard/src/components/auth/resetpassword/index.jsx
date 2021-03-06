import API from 'api';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormValidation from 'components/formvalidation';
import Loading from 'components/loading/button';
import Captcha from 'components/captcha';

import ResendIcon from '@material-ui/icons/Cached';

const styles = theme => {
	const width = 400;
	return {
		msgText: {
			color: '#fff',
			whiteSpace: 'pre-line',
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
				height: 35,
				display: 'block',
				textAlign: 'center',
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

class ResetPassword extends Component{
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

	handleReset = e => {
		this.setState({ loading: true });
		const key = 'reset-password';
		const formData = new FormData(e.target);
		const url = `/auth/${key}`;
		const cb = {
			error: result => {
				this.props.createCaptcha();
				this.setState({
					success: null,
					error: result.message,
					loading: false,
				})
			},
			limited: result => this.props.handleLimited(result),
			succeed: result => {
				window.sessionStorage.removeItem('phoneNumber');
				this.setState({
					success: "?????? ???????? ???? ???????????? ???????? ????\n?????????? ???????????? ???? ???????? ????????...",
					error: null,
					loading: false,
				});
				setTimeout(() => this.props.history.push('/auth/login/'), 1500);
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount(){
		this.props.setMinHeight({large: 450, small: 500});
		this.props.setCaption('?????????? ???????? ????????');
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
			isLowHeight,
		} = this.props;

		const {
			error,
			success,
			loading,
		} = this.state;

		const base = '/auth';
		const phone = window.sessionStorage.getItem('phoneNumber');

		return(
			<section>
				<Card className={classNames(
					classes.card,
					error ? classes.cardError : '',
					success ? classes.cardSuccess: ''
				)} elevation={0}>
					<FormValidation
						onChange={this.handleChange}
						onSubmit={this.handleReset}
						autoComplete="off">
						<TextField
							type="phone"
							label="?????????? ???????????? ?????? ??????"
							name="phoneNumber"
							fullWidth
							required
							helperText='?????????? ???? ???? ???????? 11 ???????? ???????? ????????'
							defaultValue={phone}
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 1,
								className: classes.textLeft,
								pattern:'09\\d{9}',
								maxLength: 11,
								autoComplete:'off'
							}}
						/>
						<TextField
							type="text"
							label="???? 6 ???????? ?????????? ?????? ???? ????????????"
							name="code"
							autoFocus
							fullWidth
							required
							helperText='???? 6 ???????? ?????????? ?????? ???? ???????????? ?????? ???? ?????????? ?????????????? ???????? ????????'
							InputProps={{
								autoComplete:'off',
								endAdornment: 
									<InputAdornment style={{direction: 'ltr'}} position='end'>
										<Tooltip placement='top' title="?????????? ???????? ????">
											<IconButton color='secondary' component={Link} to='/auth/forgot-password/'>
												<ResendIcon />
											</IconButton>
										</Tooltip>
									</InputAdornment>
							}}
							inputProps={{
								tabIndex: 2,
								className: classes.textLeft,
								pattern:'\\d{0,6}',
								maxLength: 6,
								autoComplete:'off'
							}}
						/>
						<TextField
							type="password"
							label="?????? ???????? ????????"
							name="password"
							fullWidth={isLowHeight}
							required
							helperText='?????? ???????? ???????? ???? ??????????????'
							className={isLowHeight ? "" : classes.textWidth}
							InputProps={{autoComplete:'off'}}
							inputProps={{
								tabIndex: 3,
								className: classes.textLeft,
								autoComplete:'off'
							}}
						/>
						<TextField
							name='passwordVerify'
							type="password"
							label="?????????? ?????? ???????? ????????"
							fullWidth={isLowHeight}
							required
							helperText='?????????? ?????? ???????? ???? ??????????????'
							className={isLowHeight ? "" : classes.textWidth}
							InputProps={{autoComplete:'off'}}
							inputProps={{
								sameAs:'password',
								tabIndex: 4,
								className: classes.textLeft,
								autoComplete:'off'
							}}
						/>
						<Captcha
							tabIndex={5}
							createCaptcha={createCaptcha}
							captcha={captcha}
							name='captchaValue'
							helperText
						/>
						{(error || success) && (
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
						)}
						<Button
							tabIndex={6}
							className={classes.btnLogin}
							variant="raised"
							disabled={loading || (success && success.length > 0)}
							fullWidth
							type='submit'
							color="primary">
							??????
							<Loading
								color='#ddd'
								show={loading} />
						</Button>
					</FormValidation>
				</Card>
				<div className={classes.footer}>
					<Link className={classNames(classes.link, classes.login)} to={`${base}/`}>???????? ???? ????????????</Link>
					<Link className={classNames(classes.link, classes.forgot)} to={`${base}/forgot-password/`}>?????????? ???????? ???? 6 ????????</Link>
				</div>
			</section>
		);
	}
}

export default withStyles(styles)(ResetPassword);
