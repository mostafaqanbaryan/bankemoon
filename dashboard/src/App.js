/* eslint-disable import/first */
import API from 'api';
import utils from 'utils';
import React from 'react';
import Loadable from 'react-loadable-visibility';
import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core/styles';
// import WebFont from 'webfontloader';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

// Elements
import Header from 'components/header';
import Footer from 'components/footer';
import Logout from 'components/auth/logout';
import NotFound from 'components/notFound';
import LogoLoading from 'components/loading/logo';
import RouterLoggedIn from 'components/router/loggedIn';
import ErrorBoundary from 'components/errorBoundary';

const RouterAuth = Loadable({
	loader: () => import('components/router/auth'),
	loading: () => <LogoLoading center />
});
const RouterAdmin = Loadable({
	loader: () => import('components/router/admin'),
	loading: () => <LogoLoading center />
});

// Color
import Teal from '@material-ui/core/colors/teal';
import Green from '@material-ui/core/colors/green';
import Orange from '@material-ui/core/colors/orange';
import Red from '@material-ui/core/colors/red';


// Fonts
/* WebFont.load({
	custom: {
		families: ['IRANSans'],
		urls: [utils.cdn('/css/font-style.css')]
	}
}); */

// Theme color
let colorMaker = () => {
	let colors = {};
	colors.primary = opacity => `rgba(104, 118, 120, ${opacity})`;

	// Success
	colors.success = {};
	colors.success.text = '#4f6';
	colors.success.background = opacity => `rgba(75, 175, 111, ${opacity})`;

	// Error
	colors.error = {};
	colors.error.text = '#721c24';
	colors.error.background = opacity => `rgba(158, 60, 60, ${opacity})`;
	return colors;
};

// Customize ui-Material Theme
const theme = createMuiTheme({
	colors: colorMaker(),
	overrides: {
		MuiCheckbox: {
			checked: {
				color: Teal[500],
				textAlign: 'center'
			}
		},
		MuiInput: { // For making SELECT and INPUT parallel
			root: {
				lineHeight: 'normal',
			},
		},
		MuiInputLabel: {
			root: {
				textAlign: 'right',
				transformOrigin: 'top right',
			},
			shrink: {
				transformOrigin: 'top right',
			},
			formControl: {
				right: 0,
				left: null
			},
		},
		MuiInputAdornment: {
			positionEnd: {
				marginRight: 10,
				marginLeft: 0,
			}
		},
		MuiFormControlLabel: {
			root: {
				marginLeft: 8 * 2,
				marginRight: -14,
			}
		},
		MuiFormHelperText: {
			root: {
				lineHeight: '1.5rem',
			}
		},
		MuiTableCell:{
			root: {
				textAlign: 'right',
				maxWidth: '250px',
				// background: 'white'
			}
		},
		MuiTableRow: {
			hover: {
				'&:nth-child(odd)': {
					background: '#F5F5F5'
				}
			}
		},
		MuiTableSortLabel: {
			root: {
				flexDirection: 'row'
			}
		},
		MuiSelect: {
			select: {
				paddingLeft: 32,
				paddingRight: 0
			},
			icon: {
				right: 'unset',
				left: 0,
			}
		},
		MuiSwitch: {
			root: {
				direction: 'ltr',
			}
		}
	},
	direction: 'rtl',
	fonts: {
		en : "'Ubuntu', sans-serif"
	},
	palette: {
		background:{
			secondary: '#333'
		},
		/* primary: {
			contrastText: "#fff",
			dark : "#303f9f",
			light : "#7986cb",
			main : "#007bff",
		} */
	},
	typography: {
		fontFamily: 'IRANSans, sans-serif',
	},
	header: {
		height: 65,
	},
	footer: {
		height: 208,
	},
	hidden: {
		xs: {
			'@media (max-width: 600px)': {
				display: 'none'
			}
		},
		sm: {
			'@media (max-width: 960px)': {
				display: 'none'
			}
		},
		md: {
			'@media (max-width: 1280px)': {
				display: 'none'
			}
		},
		lg: {
			'@media (max-width: 1920px)': {
				display: 'none'
			}
		},
		xl: {
			'@media (min-width: 1920px)': {
				display: 'none'
			}
		},
	}
});

const styles = theme => ({
	'@global': {
		'body': {
			fontFamily: '"IRANSans", sans-serif',
		},
		'.swal-text': {
				textAlign: 'center',
		},
		'.swal-footer': {
			textAlign: 'left',
		},
		'.swal-button': {
			fontFamily: 'IRANSans, sans-serif!important',
		}
	},
	background: {
		overflow: 'hidden',
		minHeight: '100vh',
		backgroundColor: theme.palette.grey[200],
		backgroundAttachment: 'fixed',
		backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d9d9d9' fill-opacity='0.5' fill-rule='evenodd'/%3E%3C/svg%3E")`,
	},
	footer: {
		marginTop: '15px',
	},
});


const headerHeight = 65;

class App extends React.Component {
	smallScreenWidth = () => 960;
	getUserId = () => parseInt(window.localStorage.getItem('userId') || window.sessionStorage.getItem('userId'), 10);
	getSessionId = () => window.localStorage.getItem('sessionId') || window.sessionStorage.getItem('sessionId');
	isNotFound = () => {
		return window.location.pathname.search(/^\/portal\/not-found\/?$/) === 0;
	};

	state = {
		isLoggedIn: false,
		sidebarOpen: localStorage.getItem('sidebarOpen') ? localStorage.getItem('sidebarOpen') === 'true' : true,
		sidebarShow: window.innerWidth >= this.smallScreenWidth(),

		badges: null,
		user: null,
		error: null,
	};

	types = {
		transaction: {
			payment: {
				color: '#00ff7f',
				value: 'سپرده'
			},
			loan: {
				color: '#3b86cc',
				value: 'وام',
			},
			instalment: {
				color: '#3bcca4',
				value: 'قسط وام',
			},
			initial: {
				color: '#ca3bcc',
				value: 'سرمایه اولیه',
			}
		},
		instalment: {
			instalment: {
				color: '#3bcca4',
				value: 'قسط',
			},
			commission: {
				color: '#f60',
				value: 'کارمزد',
			},
			penalty: {
				color: '#f55f58',
				value: 'دیرکرد',
			},
		},
		user: {
			SiteAdmin: 'مدیر کل',
			Management: 'مدیر بخش',
			User: 'کاربر عادی',
			bank: {
				Creator: 'موسس',
				BankAdmin: 'مدیر',
			}
			// Premium: 'کاربر طلایی',
		},
		package: {
			gold: 'طلایی',
			silver: 'نقره‌ای',
			free: 'رایگان',
		},
		status: {
			Accepted: {
				value: 'تایید شده',
				color: Green[700],
			},
			Pending: {
				value: 'در حال بررسی',
				color: Orange[400],
			},
			Declined: {
				value: 'رد شده',
				color: Red[700],
			},
			Answered: {
				value: 'جواب داده شده',
				color: Green[700],
			},
			UnAnswered: {
				value: 'بدون جواب',
				color: Red[700],
			},
			Readed: {
				value: 'خوانده شده',
				color: Green[700],
			},
			NotReaded: {
				value: 'خوانده نشده',
				color: Red[700],
			},
			Closed: {
				value: 'بسته شده',
				color: '#333',
			},
		},
		department: {
			Financial: 'مالی',
			Design: 'طراحی',
			Technical: 'فنی',
			Suggestions: 'پیشنهادات',
			Management: 'مدیریت',
		},
		post: {
			News: 'خبرها',
			Tutorials: 'آموزش‌ها',
		}
	};

	blog = {
		news(title){
			const base = '/blog/news';
			if(title)
				return [base, title].join('/') + '/';
			return base + '/';
		},
		tutorials(title){
			const base = '/blog/tutorials';
			if(title)
				return [base, title].join('/') + '/';
			return base + '/';
		}
	}

	handleError = err => {
		if(err.code === 404)
			return this.removeSession();
		this.setState({ error: err.message });
	}

	getLoggedInUser = (userId, sessionId) => {
		if(!sessionId || !userId)
			return false;
		const key = 'snapshot';
		const url = `/users/${key}/`;
		const cb = {
			unAuth: result => this.removeSession(),
			error: this.handleError,
			succeed: result => this.setState({
				user: result.data.user,
				badges: result.data.badges,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	getBadges = () => {
		const key = 'badges';
		const url = `/users/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
					badges: result.data.badges,
				})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	updateUserAvatar = avatar => {
		const user = this.state.user;
		user.avatar = avatar;
		this.setState({ user });
	};

	getSession = () => {
		const sessionId = this.getSessionId();
		const userId = this.getUserId();
		const isLoggedIn = sessionId && sessionId.length > 0;
		// if(this.state.sessionId !== sessionId){
		if(this.state.isLoggedIn !== isLoggedIn){
			this.setState({
				/* userId,
				sessionId, */
				isLoggedIn
			});
		}
		this.getLoggedInUser(userId, sessionId);
	};

	removeSession = () => {
		window.localStorage.removeItem('sessionId');
		window.localStorage.removeItem('userId');
		window.sessionStorage.removeItem('sessionId');
		window.sessionStorage.removeItem('userId');
		this.setState({
			isLoggedIn: false,
			sessionId: null,
			userId: 0,
		});
		// window.location.href = '/auth/login/';
	};

	reload = () => {
		this.setState({ error: null });
		const sessionId = this.getSessionId();
		const userId = this.getUserId();
		this.getLoggedInUser(userId, sessionId);
	};

	/* handleProgress = e => {
		const progress = Math.round(e.loaded * 100 / e.total);
		this.setState({ progress });
		console.log('message', 'app', progress);
	}; */

	// Sidebar
	closeSidebar = () => {
		if(this.state.sidebarShow)
			this.handleSidebarDrawer();
	}

	handleSidebarShowOnResize = () => {
		if(window.innerWidth >= this.smallScreenWidth()){
			document.body.style.overflowY = '';
			this.setState({sidebarShow: true, sidebarOpen: true});
		} else if(this.state.sidebarShow && window.innerWidth < this.smallScreenWidth()) {
			this.setState({sidebarShow: false, sidebarOpen: true});
		}
		localStorage.setItem('sidebarOpen', true);
	};

	handleSidebarStickyOnScroll = () => {
		// Small screen, Hide sidebar
		if(!this.state.sidebarShow && window.innerWidth < this.smallScreenWidth())
			return;

		let padding = 0;
		let sidebar = document.getElementById('sidebar');
		if(!sidebar)
			return;
		let sidebarHeight = sidebar.offsetHeight;
		let screenHeight = window.innerHeight;
		let scrollTop = document.documentElement.scrollTop;
		if(screenHeight + scrollTop - headerHeight - padding <= sidebarHeight) {
			sidebar.style.top =	-(scrollTop-headerHeight) + 'px';
		}
		else {
			sidebar.style.top =	(screenHeight - sidebarHeight-padding) + 'px';
		}
	};

	handleSidebarDrawer = () => {
		if(window.innerWidth <  this.smallScreenWidth()){
			// Fullwidth smallscreen sidebar
			if(!this.state.sidebarShow)
				document.body.style.overflowY = 'hidden';
			else
				document.body.style.overflowY = '';

			this.setState((prev) => ({ sidebarShow: !prev.sidebarShow }));
		}else{
			this.setState((prev) => {
				let local = localStorage.getItem('sidebarOpen') === 'true';
				localStorage.setItem('sidebarOpen', !local);
				return { sidebarOpen: !local }
			});
		}
		this.handleSidebarStickyOnScroll();
	};

	componentWillMount(){
		const rememberMe = window.localStorage.getItem('rememberMe');
		if(rememberMe !== 'true' && rememberMe !== 'false')
			window.localStorage.setItem('rememberMe', true);

		if(!localStorage.getItem('sidebarOpen'))
			localStorage.setItem('sidebarOpen', true);

		this.API = new API();
		this.getSession();
	}

	componentWillUnmount(){
		this.API.cancel();
	}

	render() {
		// console.log(theme);
		const {
			classes
		} = this.props;
		const {
			isLoggedIn,
			user,
			error,
		} = this.state;

		return (
			<MuiThemeProvider theme={theme}>
				<Router basename='/portal/'>
					<ErrorBoundary fullScreen reload={this.reload} error={error}>
						<div className={classes.background}>
							<Header
								isLoggedIn={this.state.isLoggedIn}
								role={user && user.role}
								className={classes.header}
								handleSidebarDrawer={this.handleSidebarDrawer}
								badges={this.state.badges}
								isNotFound={this.isNotFound}
							/>
							<Switch>
								<Route exact path='/not-found' render={ props => (
									isLoggedIn
									? <NotFound
											blog={this.blog}
											{...props}
										/>
									: <Redirect to='/auth/login/' />
								)} />
								<Route exact path='/auth/logout' render={ props => (
									isLoggedIn
										? <Logout
												removeSession={this.removeSession}
												{...props}
											/>
										: <Redirect to='/' />
								)} />
								<Route path='/auth' render={ props => (
									!isLoggedIn
									? <RouterAuth
											{...this.state}
											{...props}
											types={this.types}
											getSession={this.getSession}
											smallScreenWidth={this.smallScreenWidth}
										/>
									: <Redirect to='/' />
								)} />
								<Route path='/admin' render={ props => (
									isLoggedIn
									? <RouterAdmin
											user={user}
											types={this.types}
											{...this.state}
											{...props}
										/>
									: <Redirect to='/auth/login/' />
								)} />
								<Route path='/' render={ props => (
									isLoggedIn
									? <RouterLoggedIn
											{...this.state}
											{...props}
											types={this.types}
											smallScreenWidth={this.smallScreenWidth}
											handleSidebarStickyOnScroll={this.handleSidebarStickyOnScroll}
											handleSidebarShowOnResize={this.handleSidebarShowOnResize}
											closeSidebar={this.closeSidebar}
											getBadges={this.getBadges}
											getUserId={this.getUserId}
											updateUserAvatar={this.updateUserAvatar}
										/>
									: <Redirect to='/auth/login/' />
								)} />
								<Redirect to='/not-found/' />
							</Switch>
							<Footer
								user={this.state.user}
								isLoggedIn={this.state.isLoggedIn}
								className={classes.footer}
								sidebarShow={this.state.sidebarShow}
								sidebarOpen={this.state.sidebarOpen}
								blog={this.blog}
								isNotFound={this.isNotFound}
							/>
						</div>
					</ErrorBoundary>
				</Router>
			</MuiThemeProvider>
		);
	}
}

export default withStyles(styles)(App);
