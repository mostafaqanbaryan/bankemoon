/* eslint-disable import/first */
import API from 'api';
import React from 'react';
import Loadable from 'react-loadable';
import propTypes from 'prop-types';
import classNames from 'classnames';
import { Route, Redirect, Link, Switch } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
// import pMinDelay from 'p-min-delay';
import utils from 'utils';

// Elements
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import LogoLoading from 'components/loading/logo';

import BadgeEnhancement from 'components/enhancement/badge';
import DocumentTitle from 'components/documentTitle';

/* const BankHeader = Loadable({
	loader: () => pMinDelay(import('components/bank/header'), 1000),
	loading: () => <LogoLoading />
}); */
import BankHeader from 'components/bank/header';
const BankEdit = Loadable({
	loader: () => import('components/bank/edit'),
	loading: () => <LogoLoading />
});
const BankPlan = Loadable({
	loader: () => import('components/bank/plan'),
	loading: () => <LogoLoading />
});
// import Users from 'components/bank/users';
const Users = Loadable({
	loader: () => import('components/bank/users'),
	loading: () => <LogoLoading />
});
const Loans = Loadable({
	loader: () => import('components/bank/loans'),
	loading: () => <LogoLoading />
});
const Message = Loadable({
	loader: () => import('components/bank/message'),
	loading: () => <LogoLoading />
});
const Requests = Loadable({
	loader: () => import('components/bank/requests'),
	loading: () => <LogoLoading />
});
const Invitation = Loadable({
	loader: () => import('components/bank/invitation'),
	loading: () => <LogoLoading />
});
const Transaction = Loadable({
	loader: () => import('components/bank/transaction'),
	loading: () => <LogoLoading />
});
const Transactions = Loadable({
	loader: () => import('components/bank/transactions'),
	loading: () => <LogoLoading />
});

// Icons
import TransactionIcon from '@material-ui/icons/Description';
import LoanIcon from '@material-ui/icons/DateRange';
import AddIcon from '@material-ui/icons/Add';
import UserIcon from '@material-ui/icons/GroupAdd';
import RequestIcon from '@material-ui/icons/ContentPaste';
import MessageIcon from '@material-ui/icons/Message';


const styles = theme => ({
	adminMenuTitle: {
		position: 'relative',
		textAlign: 'center',
		margin: theme.spacing.unit*2,
		marginBottom: 0,
		paddingBottom: 5,
		'&:after': {
			content: '""',
			position: 'absolute',
			display: 'block',
			// background: '#000',
			/* height: '2px',
			top: '50%',
			right: '50%',
			left: 0, */
			top: '100%',
			right: 0,
			left: 0,
			bottom: 0,
			border: '2px solid #666',
			borderBottom: 0,
			borderRadius: '50%',
		}
	},
	button: {
		background: theme.palette.common.white,
		height: 50,
		borderRadius: 50,
	},
	addButton: {
		background: '#73ff91',
		'&:hover': {
			background: '#63cf81'
		}
	},
	fab: {
		position: 'fixed',
		left: theme.spacing.unit * 3,
		bottom: theme.spacing.unit * 3,
		marginBottom: 0,
		transform: 'scale(0)',
		willChange: 'transform, margin-bottom',
		transition:
		`margin-bottom 225ms cubic-bezier(0, 0, 0.2, 1) 0ms,
		transform 500ms cubic-bezier(0.4, 0, 0.2, 1) 500ms`
	},
	fabMoveUp: {
		marginBottom: 64,
	},
	rightIcon: {
		marginLeft: theme.spacing.unit,
		color: '#444',
	},
	textLeft: {
		textAlign: 'left'
	},
	zoom: {
		animationDelay: '0.5s, 1s',
		animation: 'zoom-out 0.5s forwards, zoom-in-out 1s infinite alternate-reverse',
	},
	'@keyframes zoom-out': {
		'from': {
			transform: 'scale(0)',
		},
		'to': {
			transform: 'scale(1)'
		},
	},
	'@keyframes zoom-in-out': {
		'from': {
			transform: 'scale(0.7)',
		},
		'to': {
			transform: 'scale(1)'
		},
	},
});
class Bank extends React.Component{
	state = {
		bankOptions: null,
		userSelection: [],
	}

	handleError = err => this.setState({ error: err.message });

	getBankOptions = bankUsername => {
		const key = 'options';
		const url = `/banks/${bankUsername}/${key}`;
		const cb = {
			error: this.handleError,
			limited: this.handleError,
			succeed: (result => {
				this.setState({
					bankOptions: result.data.options,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	updateBankOptions = (name, value) => {
		const bankOptions = this.state.bankOptions;
		bankOptions[name] = value;
		this.setState({ bankOptions });
	};

	getUsersList = bankUsername => () => {
		let users = this.getSelectedUsers(bankUsername)();
		if(users.hasOwnProperty('all')){
			Object.keys(users.all).forEach(uid => {
				users[uid+'-subset'] = {fn: `تمامی زیرمجموعه‌های ${users.all[uid]}`, p: uid};
			});
		}
		delete users.all;
		return users;
	};

	getSelectedUsers = bankUsername => () => {
		let selectedUsers = window.sessionStorage.getItem('selectedUsers');
		selectedUsers = selectedUsers ? JSON.parse(selectedUsers) : {};
		let bankSelectedUsers = selectedUsers.hasOwnProperty(bankUsername) ? selectedUsers[bankUsername] : {};
		return bankSelectedUsers;
	};

	setSelectedUsers = bankUsername => bankSelectedUsers => {
		// bankSelectedUsers = JSON.stringify(bankSelectedUsers);
		let selectedUsers = window.sessionStorage.getItem('selectedUsers');
		selectedUsers = selectedUsers ? JSON.parse(selectedUsers) : {};
		selectedUsers[bankUsername] = bankSelectedUsers;
		selectedUsers = JSON.stringify(selectedUsers);
		window.sessionStorage.setItem('selectedUsers', selectedUsers);
		this.forceUpdate();
	};

	addSelectedUser = bankUsername => user => {
		const users = this.getSelectedUsers(bankUsername)();
		// users[user.id] = { fn: user.full_name };
		users[user.user_id] = { fn: user.full_name };
		if(user.parent_id)
			// users[user.id].p = user.parent_id;
			users[user.user_id].p = user.parent_id;
		this.setSelectedUsers(bankUsername)(users);
	};

	removeSelectedUser = bankUsername => (userId, parentId) => e => {
		const users = this.getSelectedUsers(bankUsername)();
		if(parentId && parentId > 0 && users.hasOwnProperty('all') && users.all.hasOwnProperty(parentId))
			delete users.all[parentId];
		else
			delete users[userId];
		this.setSelectedUsers(bankUsername)(users);
	};

	clearSelectedUsers = bankUsername => e => {
		const users = {};
		this.setSelectedUsers(bankUsername)(users);
	};

	getSearchTransactions = () => {
		let search = window.sessionStorage.getItem('search');
		return search ? JSON.parse(search) : {};
	};

	setSearchTransactions = search => {
		search = JSON.stringify(search);
		window.sessionStorage.setItem('search', search);
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
			bankBadges,
			bankInfo,
			getUserId,
		} = this.props;
		const {
			userSelection,
			bankOptions,
		} = this.state;

		// const bankUsername = this.props.getBankUsername();
		const bankUsername = this.props.match.params.bankUsername;
		// const base = `/@${bankUsername}`;
		const base = `/@:bankUsername`;
		const baseUrl = `/@${bankUsername}`;

		const show =
			this.props.location.pathname.search(`${baseUrl}/transaction/`) === -1 &&
			this.props.location.pathname.search(`${baseUrl}/plan/`) === -1 &&
			this.props.location.pathname.search(`${baseUrl}/admin/`) === -1;
		const userRole = bankInfo && bankInfo.role;
		const isAdmin = utils.isBankAdmin(userRole);
		return (
			<DocumentTitle title={bankInfo ? bankInfo.name : 'درحال دریافت اطلاعات...'}>
				<section>
					<header>
						<BankHeader
							info={bankInfo}
							options={bankOptions}
							types={this.props.types}
							getBankOptions={this.getBankOptions.bind(this, bankUsername)} />
						<Grid style={{marginTop: 10, marginBottom: isAdmin ? 0 : 10 }} container spacing={24}>
							<Grid item xs={12} sm={6} xl>
								<BadgeEnhancement fullWidth badgeContent={bankBadges ? bankBadges.transactions : 0} color='secondary'>
									<Button className={classes.button} fullWidth variant='raised' component={Link} to={`${baseUrl}/transactions/`}>
										<TransactionIcon className={classes.rightIcon} />
										صورت حساب
									</Button>
								</BadgeEnhancement>
							</Grid>
							<Grid item xs={12} sm={6} xl>
								<BadgeEnhancement fullWidth badgeContent={bankBadges ? bankBadges.loans : 0} color='secondary'>
									<Button className={classes.button} fullWidth variant='raised' component={Link} to={`${baseUrl}/loans/`}>
										<LoanIcon className={classes.rightIcon} />
										وام‌های معوقه
									</Button>
								</BadgeEnhancement>
							</Grid>
						</Grid>
						{bankInfo && isAdmin &&
							<Grid container style={isAdmin ? { marginBottom: 10 } : {}} spacing={24}>
								<Grid item xs={12}>
									<Typography className={classes.adminMenuTitle}>
										منوی مدیریت
									</Typography>
								</Grid>
								<Grid item xs={12} sm={6} lg={3} xl>
									<BadgeEnhancement fullWidth badgeContent={bankBadges ? bankBadges.requests : 0} color='secondary'>
										<Button className={classes.button} fullWidth variant='raised' component={Link} to={`${baseUrl}/admin/requests/`}>
											<RequestIcon className={classes.rightIcon} />
											درخواست عضویت
										</Button>
									</BadgeEnhancement>
								</Grid>
								<Grid item xs={12} sm={6} lg={3} xl>
									<Button className={classes.button} fullWidth variant='raised' component={Link} to={`${baseUrl}/admin/invitation/`}>
										<UserIcon className={classes.rightIcon} />
										افزودن کاربر
									</Button>
								</Grid>
								<Grid item xs={12} sm={6} lg={3} xl>
									<Button className={classes.button} fullWidth variant='raised' component={Link} to={`${baseUrl}/admin/message/`}>
										<MessageIcon className={classes.rightIcon} />
										ارسال پیام
									</Button>
								</Grid>
								<Grid item xs={12} sm={6} lg={3} xl>
									<Button className={classes.button} style={{ background: 'yellow' }} fullWidth variant='raised' component={Link} to={`${baseUrl}/admin/message/`}>
										<MessageIcon className={classes.rightIcon} />
										درگاه پرداخت اینترنتی
									</Button>
								</Grid>
							</Grid>
						}
					</header>

					<section id='bank-content'>
						<Switch>
							{bankInfo && !isAdmin &&
								<Redirect from={`${baseUrl}/admin`} to='/not-found/' />
							}

							<Route exact path={`${base}/edit`} render={props => (
								<BankEdit
									bankInfo={bankInfo}
									bankOptions={bankOptions}
									getBankOptions={this.getBankOptions.bind(this, bankUsername)}
									updateBankAvatar={this.props.updateBankAvatar}
									updateBankInfo={this.props.updateBankInfo}
									updateBankOptions={this.updateBankOptions}
									handleOpenSnack={this.props.handleOpenSnack}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/plan`} render={props => (
								<BankPlan
									handleOpenSnack={this.props.handleOpenSnack}
									{...props}
								/>
							)} />

							<Route exact path={[`${base}/page/:currentPage`, `${base}/`]} render={props => (
								<Users
									selected={userSelection}
									getSelectedUsers={this.getSelectedUsers(bankUsername)}
									setSelectedSubsets={this.setSelectedSubsets}
									setSelectedUsers={this.setSelectedUsers(bankUsername)}
									getSearchTransactions={this.getSearchTransactions}
									setSearchTransactions={this.setSearchTransactions}
									handleOpenSnack={this.props.handleOpenSnack}
									getUserId={getUserId}
									types={this.props.types}
									userRole={userRole}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/loans/`} render={(props) => (
								<Loans
									setSelectedUsers={this.setSelectedUsers(bankUsername)}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/transactions/`} render={(props) => (
								<Transactions
									types={this.props.types}
									role={bankInfo ? bankInfo.role : 'member'}
									handleOpenSnack={this.props.handleOpenSnack}
									getSearchTransactions={this.getSearchTransactions}
									setSearchTransactions={this.setSearchTransactions}
									{...props}
								/>
							)} />

							<Route path={`${base}/transaction/:type(instalment|payment|loan|initial)/`} render={(props) => (
								<Transaction
									types={this.props.types}
									getUsers={this.getUsersList(bankUsername)}
									getSelectedUsers={this.getSelectedUsers(bankUsername)}
									setSelectedUsers={this.setSelectedUsers(bankUsername)}
									addSelectedUser={this.addSelectedUser(bankUsername)}
									clearSelectedUsers={this.clearSelectedUsers(bankUsername)}
									removeSelectedUser={this.removeSelectedUser(bankUsername)}
									handleOpenSnack={this.props.handleOpenSnack}
									role={bankInfo ? bankInfo.role : 'member'}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/admin/invitation/`} render={(props) => (
								<Invitation
									handleOpenSnack={this.props.handleOpenSnack}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/admin/requests/`} render={(props) => (
								<Requests
									bankBadges={this.props.bankBadges}
									updateBankBadges={this.props.updateBankBadges}
									setSelectedUsers={this.setSelectedUsers(bankUsername)}
									{...props}
								/>
							)} />

							<Route exact path={`${base}/admin/message/`} render={(props) => (
								<Message
									getUsers={this.getUsersList(bankUsername)}
									addSelectedUser={this.addSelectedUser(bankUsername)}
									removeSelectedUser={this.removeSelectedUser(bankUsername)}
									clearSelectedUsers={this.clearSelectedUsers(bankUsername)}
									handleOpenSnack={this.props.handleOpenSnack}
									{...props}
								/>
							)} />
							<Redirect from={`${base}/transaction/`} to={`${base}/transaction/payment/`} />
							<Redirect to={`${base}/`} />
						</Switch>
					</section>

					{show &&
						<Tooltip title='تراکنش جدید'>
							<Button
								className={classNames(classes.zoom, classes.fab, this.props.isSnackOpen() ? classes.fabMoveUp : '')}
								component={Link}
								to={`${baseUrl}/transaction/payment/`}
								variant='fab'
								color='primary'
								aria-label='add'>
								<AddIcon />
							</Button>
						</Tooltip>
					}
				</section>
			</DocumentTitle>
		);
	}
}

Bank.propTypes = {
	// users									: propTypes.object.isRequired,
	// admins								: propTypes.array.isRequired,
	badgeRequestCount			: propTypes.number,
	badgeTransactionCount : propTypes.number,
	badgeLoanCount				: propTypes.number,
};
export default withStyles(styles)(Bank);
