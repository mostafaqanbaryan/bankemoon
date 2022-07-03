import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Route, Switch, Redirect } from 'react-router-dom';
import Loadable from 'react-loadable';

// Elements
import Sidebar from 'components/sidebar';
import Sticky from 'components/sticky';
import Snack from 'components/snack';
import LogoLoading from 'components/loading/logo';

/* const Banks = Loadable({
	loader: () => import('components/banks'),
	loading: () => <LogoLoading center />
}); */
import Banks from 'components/banks';

const NewBank = Loadable({
	loader: () => import('components/bank/new'),
	loading: () => <LogoLoading center />
});

const RouterBank = Loadable({
	loader: () => import('components/router/bank'),
	loading: () => <LogoLoading center />
});

const NewTicket = Loadable({
	loader: () => import('components/me/ticket/new'),
	loading: () => <LogoLoading center />
});

const MyTicket = Loadable({
	loader: () => import('components/me/ticket'),
	loading: () => <LogoLoading center />
});

const MyTickets = Loadable({
	loader: () => import('components/me/tickets'),
	loading: () => <LogoLoading center />
});
const Sessions = Loadable({
	loader: () => import('components/sessions'),
	loading: () => <LogoLoading center />
});
/* const MyBanks = Loadable({
	loader: () => import('components/me/banks'),
	loading: () => <LogoLoading center />
}); */
const MyProfile = Loadable({
	loader: () => import('components/me/profile'),
	loading: () => <LogoLoading center />
});
const MyMessages= Loadable({
	loader: () => import('components/me/messages'),
	loading: () => <LogoLoading center />
});

// const headerHeight = 65;
const styles = theme => ({
	frame: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row-reverse',
		height: '100%',
		width: '100%',
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
		}
	},
	middle: {
		marginRight: 320,
		transition: theme.transitions.create('margin', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
		[theme.breakpoints.down('sm')]: {
			marginRight: 0,
		}
	},
	main: {
		padding: '12px',
		width: '100%',
		// minHeight: '55vh',
		minHeight: 'calc(100% - 208px)',
		flexGrow: 1,
		zIndex: theme.zIndex.drawer - 1,
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
			width: 'auto',
		}
	},
	sidebar: {
		padding: 12,
		position: 'fixed',
		right: 0,
		zIndex: 1199,
	},
});

class LoggedInRouter extends Component{
	snackQueue = [];
	state = {
		snackOpen: false,
		snackMessage: '',
		snackVariant: 'info',
	};

	// Snack -->
	handleOpenSnack = obj => {
		this.snackQueue.push(obj);
		if(this.state.snackOpen){
			this.setState({
				snackOpen: false,
			});
		} else {
			this.handleQueue();
		}
	};

	handleCloseSnack = () => {
		this.setState({
			snackOpen: false,
		});
	};

	handleQueue = () => {
		if(this.snackQueue.length > 0){
			let queue = this.snackQueue.shift();
			this.setState({
				snackMessage: queue.message,
				snackVariant: queue.variant,
				snackOpen: true,
			});
		}
	};
	// <-- Snack


	componentDidMount(){
		this.props.handleSidebarStickyOnScroll();

		// Sidebar hide & show with resize window
		window.addEventListener('resize', this.props.handleSidebarShowOnResize);
		window.addEventListener('resize', this.props.handleSidebarStickyOnScroll);

		// Close sidebar when click on some link (smallScreen)
		this.props.history.listen((location, action) => {
			if(this.props.sidebarShow && window.innerWidth < 565)
				this.props.closeSidebar();
		});
		this.intervalBadge = setInterval(() => {
			this.props.getBadges();
		}, 30000);
		// Refresh badges
		/* this.historyUnlisten = this.props.history.listen((location, action) => {
			if(!this.badgeTimeout){
				this.badgeTimeout = setTimeout(() => {
					this.badgeTimeout = null;
					this.props.getBadges();
				}, 30 * 1000); // At least 30 sec between requests
			}
		}); */
	}

	componentWillUnmount(){
		window.removeEventListener('resize', this.props.handleSidebarShowOnResize);
		window.removeEventListener('resize', this.props.handleSidebarStickyOnScroll);
		// this.historyUnlisten();
		clearInterval(this.intervalBadge);
	}

	render(){
		const {
			snackOpen,
			snackMessage,
			snackVariant,
		} = this.state;
		const {
			classes,
		} = this.props;
		const sidebarOpen = localStorage.getItem('sidebarOpen') !== 'false';

		return(
			<div id='content'>
				<section style={!sidebarOpen ? {marginRight: 80} : {}} className={classes.middle}>
					<div className={classes.frame}>
						<main className={classes.main}>
							<Switch>
								{/* Banks */}
								<Redirect from='/page/1/' to='/' />
								<Route exact path={['/page/:currentPage', '/']} render={ props => (
									<Banks
										getUserId={this.props.getUserId}
										handleOpenSnack={this.handleOpenSnack}
										{...props} />
								)} />

								<Route exact path='/new' render={ props => (
									<NewBank
										handleOpenSnack={this.handleOpenSnack}
										{...props} />
								)} />

								<Route path='/@:bankUsername' render={ props => (
									<RouterBank
										handleOpenSnack={this.handleOpenSnack}
										isSnackOpen={() => this.state.snackOpen}
										getUserId={this.props.getUserId}
										types={this.props.types}
										badges={this.props.badges}
										{...props} />
								)} />



								{/* Me Profile */}
								<Route exact path='/me' render={ props => (
									<MyProfile
										user={this.props.user}
										getUserId={this.props.getUserId}
										handleOpenSnack={this.handleOpenSnack}
										updateUserAvatar={this.props.updateUserAvatar}
										{...props} />
								)} />


								{/* Tickets */}
								<Route exact path='/tickets' render={ props => (
									<MyTickets
										getUserId={this.props.getUserId}
										getBadges={this.props.getBadges}
										types={this.props.types}
										{...props} />
								)} />
								<Route exact path='/tickets/new' render={ props => (
									<NewTicket
										types={this.props.types}
										{...props} />
								)} />
								<Route exact path='/tickets/:ticketId' render={ props => (
									<MyTicket
										getBadges={this.props.getBadges}
										types={this.props.types}
										{...props} />
								)} />



								{/* Messages */}
								<Route exact path='/messages' render={ props => (
									<MyMessages
										getUserId={this.props.getUserId}
										getBadges={this.props.getBadges}
										types={this.props.types}
										{...props} />
								)} />



								{/* Sessions */}
								<Route exact path='/sessions' render={ props => (
									<Sessions
										{...this.props}
										{...props} />
								)} />

								<Redirect to='/not-found/' />
							</Switch>
						</main>

						{this.props.sidebarShow &&
							<Sticky handleScroll={this.props.handleSidebarStickyOnScroll}>
								<Sidebar
									className={classes.sidebar}
									user={this.props.user}
									open={sidebarOpen}
									badges={this.props.badges}
									location={this.props.location}
								/>
							</Sticky>
						}
						<Snack
							open={snackOpen}
							message={snackMessage}
							variant={snackVariant}
							onClose={this.handleCloseSnack}
							onExited={this.handleQueue}
						/>
					</div>
				</section>
			</div>
		);
	}
}

export default withStyles(styles)(LoggedInRouter);
