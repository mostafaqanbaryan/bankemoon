/* eslint-disable import/first */
import API from 'api';
import React from 'react';
import Loadable from 'react-loadable';
// import pMinDelay from 'p-min-delay';
import { withStyles } from '@material-ui/core/styles';
import { Route, Switch, Redirect } from 'react-router-dom';
import utils from 'utils';
import classNames from 'classnames';

import Card from '@material-ui/core/Card';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import LogoLoading from 'components/loading/logo';
/* import Login from 'components/auth/login';
import Register from 'components/auth/register';
import ForgotPassword from 'components/auth/forgotpassword';
import ResetPassword from 'components/auth/resetpassword'; */
const Login = Loadable({
	loader: () => import('components/auth/login'),
	loading: () => <div style={{background: 'rgba(0,0,0,0.6)', height: 248, paddingTop: 64}}><LogoLoading /></div>
});
const Register = Loadable({
	loader: () => import('components/auth/register'),
	loading: () => <div style={{background: 'rgba(0,0,0,0.6)', height: 248, paddingTop: 64}}><LogoLoading /></div>
});
const ForgotPassword = Loadable({
	loader: () => import('components/auth/forgotpassword'),
	loading: () => <div style={{background: 'rgba(0,0,0,0.6)', height: 248, paddingTop: 64}}><LogoLoading /></div>
});
const ResetPassword = Loadable({
	loader: () => import('components/auth/resetpassword'),
	loading: () => <div style={{background: 'rgba(0,0,0,0.6)', height: 248, paddingTop: 64}}><LogoLoading /></div>
});

const styles = theme => {
	const background = utils.getRandomBackground();
	const width = 400;
	return {
		errorCard: {
			padding: `${theme.spacing.unit * 7}px ${theme.spacing.unit*2}px`,
			background: theme.colors.error.background(0.9),
			textAlign: 'center',
		},
		error: {
			color: '#fff',
			// color: theme.colors.error,
			// textShadow: '1px 1px 5px #000',
		},
		errorBtn: {
			color: '#ccc',
			marginTop: theme.spacing.unit * 2,
		},
		background: {
			position: 'relative',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '100vh',
			width: '100%',
			background: `url("${background}") no-repeat center center fixed`,
			backgroundSize: 'cover',
			'&:before': {
				content: '""',
				display: 'block',
				position: 'absolute',
				top: 0,
				bottom: 0,
				right: 0,
				left: 0,
				opacity: 0.3,
				background: '#000',
			}
		},
		root:{
			position: 'fixed',
			display: 'flex',
			marginTop: 20,
			justifyContent: 'center',
			flexDirection: 'column',
			width: width,
			background: 'transparent',
			[`@media (max-width: 600px)`]: {
				marginTop: theme.header.height-15
			},
			[`@media (max-width: 400px)`]: {
				position: 'relative',
				width: '100%',
				paddingTop: 0
			}
		},
		rootLowHeight: {
			background: 'transparent',
			position: 'relative',
			width: '100%',
			paddingTop: theme.header.height,
			[`@media (max-width: 600px)`]: {
				paddingTop: theme.header.height-15,
			},
			[`@media (max-width: 400px)`]: {
				paddingTop: 0
			}
		},
		header: {
			width: '100%',
			background: 'rgba(0, 0, 0, 0.6)',
			height: 55,
			color: '#ddd',
			textAlign: 'center',
			paddingTop: 25,
			borderRadius: '5px 5px 0 0',
			[`@media (max-width: ${width}px)`]: {
				height: 85,
			}
		},
		desc: {
			fontWeight: 400,
			fontSize: '1.1rem',
		},
		title: {
			color: '#ddd',
			display: 'inline',
			marginLeft: 10,
			[`@media (max-width: ${width}px)`]: {
				display: 'block',
				marginLeft: 0,
			}
		},
		caption: {
			color: '#ddd',
			paddingTop: 5,
			[`@media (max-width: ${width}px)`]: {
			}
		},
	};
}

class RouterAuth extends React.Component{
	state = {
		isLowHeight: false,
		caption: '',
		captcha: null,
		error: null,
		minHeight: {
			small: 0,
			large: 0,
		},
	};

	reload = () => {
		this.createCaptcha();
		this.setState({ error: null });
	};

	setMinHeight = minHeight => {
		if(this.state.minHeight.small !== minHeight.small && this.state.minHeight.large !== minHeight.large) {
			this.setState({ minHeight });
			this.checkLowHeight(null, minHeight);
		}
	};

	checkLowHeight = (e, minHeight=null) => {
		let isLowHeight = false;
		if(!minHeight)
			minHeight = this.state.minHeight;
		if(window.innerWidth <= 600)
			isLowHeight = window.innerHeight < minHeight.small;
		else
			isLowHeight = window.innerHeight < minHeight.large;
		if(this.state.isLowHeight !== isLowHeight)
			this.setState({ isLowHeight });
	};

	handleLimited = err => {
		// clearTimeout(this.errorTimeout);
		// err.timeout = err.timeout || 2;
		this.setState({
			error: err.message,
			// timeout: err.timeout
		});
		// this.createTimeout(err);
	};

	createCaptcha = () => {
		let key = 'captcha';
		const cb = {
			error: result => this.setState({ error: result.message }),
			limited: result => this.handleLimited(result),
			succeed: result => this.setState({ captcha: result.data }),
		};
		API.Result(cb, this.API.getCaptcha({ key }));
	};

	/* createTimeout = err => {
		if(err.timeout > 0){
			this.errorTimeout = setTimeout(() => {
				clearInterval(this.errorInterval);
				this.setState({
					error: null,
					timeout: 0,
				});
			}, err.timeout * 1000);
			this.errorInterval = setInterval(i => this.setState(prev => ({ timeout: prev.timeout - 1})) , 1000);
		}
	}; */

	setCaption = caption => {
		if(this.state.caption !== caption)
			this.setState({ caption });
		document.title = caption + ' | بانکمون';
	};

	componentWillMount = () => {
		/* const sessionId = window.localStorage.getItem('sessionId');
		if(sessionId)
			this.props.history.push('/'); */
		this.API = new API();
	};

	componentDidMount = () => {
		window.addEventListener('resize', this.checkLowHeight);
		window.addEventListener('load', this.checkLowHeight);
		this.errorInterval = 0;
		this.errorTimeout = 0;
		// this.createCaptcha();
	};

	componentWillUnmount = () => {
		this.API.cancel();
		window.removeEventListener('resize', this.checkLowHeight);
		window.removeEventListener('load', this.checkLowHeight);
	};

	render(){
		const {
			isLowHeight,
			captcha,
			error,
			// timeout,
			caption,
		} = this.state;

		const {
			classes
		} = this.props;

		const base = this.props.match.path;

		return(
			<div className={classes.background}>
				<Paper className={isLowHeight ? classes.rootLowHeight : classes.root}>
					<header className={classes.header}>
						<Typography className={classNames(classes.title, classes.desc)} variant="title">سامانه بانکداری</Typography>
						<Typography className={classes.title} variant="title">بانکمون</Typography>
						<Typography className={classes.caption} variant="caption">{caption}</Typography>
					</header>

					{error
						? <section>
								<Card className={classes.errorCard} elevation={0}>
									<Typography className={classes.error}>
										{error}
									</Typography>
									{/*<Typography className={classes.error}>
										{timeout}
									</Typography>*/}
									<Button
										fullWidth
										className={classes.errorBtn}
										onClick={this.reload}>تلاش مجدد</Button>
								</Card>
							</section>
						: <Switch>
								<Route exact path={`${base}/login`} render={ props => (
									<Login
										{...props}
										isLowHeight={isLowHeight}
										setMinHeight={this.setMinHeight}
										smallScreenWidth={this.props.smallScreenWidth}
										createCaptcha={this.createCaptcha}
										captcha={captcha}
										handleLimited={this.handleLimited}
										setCaption={this.setCaption}
										getSession={this.props.getSession}
									/>
								)} />
								<Route exact path={`${base}/register`} render={ props => (
									<Register
										{...props}
										isLowHeight={isLowHeight}
										setMinHeight={this.setMinHeight}
										smallScreenWidth={this.props.smallScreenWidth}
										createCaptcha={this.createCaptcha}
										captcha={captcha}
										handleLimited={this.handleLimited}
										setCaption={this.setCaption}
									/>
								)} />
								<Route exact path={`${base}/forgot-password`} render={ props => (
									<ForgotPassword
										{...props}
										isLowHeight={isLowHeight}
										setMinHeight={this.setMinHeight}
										smallScreenWidth={this.props.smallScreenWidth}
										createCaptcha={this.createCaptcha}
										captcha={captcha}
										handleLimited={this.handleLimited}
										setCaption={this.setCaption}
									/>
								)} />
								<Route exact path={`${base}/reset-password`} render={ props => (
									<ResetPassword
										{...props}
										isLowHeight={isLowHeight}
										setMinHeight={this.setMinHeight}
										smallScreenWidth={this.props.smallScreenWidth}
										createCaptcha={this.createCaptcha}
										captcha={captcha}
										handleLimited={this.handleLimited}
										setCaption={this.setCaption}
									/>
								)} />

								<Redirect from={base} to={`${base}/login/`} />
							</Switch>
					}

				</Paper>
			</div>
		);
	}
}

export default withStyles(styles)(RouterAuth);
