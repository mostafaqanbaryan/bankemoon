import API from 'api';
import React from 'react';
import swal from 'sweetalert';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import Square from 'components/square';
import Circle from 'components/circle';
import ErrorBoundary from 'components/errorBoundary';
import UsersReady from './ready';
import UsersPlaceholder from './placeholder';


// Utils
import utils from 'utils';

const columnData = [
	{ id: 'name', numeric: false, disablePadding: true, label: 'نام و نام خانوادگی' },
	{ id: 'balance', hidden: 'sm', numeric: true, disablePadding: false, label: 'موجودی' },
	{ id: 'createdAt', hidden: 'md', numeric: false, disablePadding: false, label: 'تاریخ عضویت' },
	{ id: 'action', numeric: false, disablePadding: false, label: 'عملیات کاربر' },
];

const styles = theme => ({
	itemSecondaryActionRoot:{
		left: 4,
		right: 'auto'
	},
	cardContent: {
		height: 80
	},
	cardHeader: {
		background: '#EEE',
	},
	balance: {
		lineHeight: '5rem',
		textAlign: 'center'
	},
	admins: {
		overflowY: 'auto',
		overflowX: 'hidden',
		maxHeight: 70
	},
	admin: {
		textAlign: 'right'
	},
	role: {
		fontSize: '0.6rem',
		transform: 'rotate(-90deg)',
	},
	name: {
		paddingRight: 0
	},
	title: {
		background: theme.palette.common.white,
		boxShadow: theme.shadows[4],
		padding: '5px 10px',
		marginBottom: 10,
	},
	searchForm: {
		marginBottom: theme.spacing.unit * 2,
		padding: theme.spacing.unit * 2,
	},
	inline: {
		display: 'inline',
	},
	paper: {
		height: 220,
		marginBottom: 20,
	},
	textLeft: {
		textAlign: 'left',
	},
	marginTop: {
		marginTop: theme.spacing.unit*2
	},
});

class Users extends React.Component{
	state = {
		transactionBalance: null,
		admins: null,
		error: null,
		users: null,
		subsets: null,
		expanded: {},
		searchType: 'name',
		userCount: 0,
		adminCount: 0,
		isSubsetDialogOpen: false,
		subsetDialogUser: null,
		rowsPerPage: 15,
	};

	handleError = err => this.setState({ error: err.message });

	handleChange = name => e =>
		this.setState({ [name]: e.target.value });

	getUsers = bankUsername => page => {
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/?page=${page}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({
					users: result.data.users,
					userCount: result.data.user_count ? parseInt(result.data.user_count, 10) : 0,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	getSubsets = userId => {
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/${userId}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				let subsets = this.state.subsets ? this.state.subsets : {};
				subsets[userId] = result.data.subsets;
				this.setState({
					subsets,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	getLoadedUserById = userId => {
		let users = this.state.users;
		for(let i in users){
			let user = users[i];
			if(user.user_id === userId)
				return user;
		}
	};

	handleExpand = (userId, isExpanded) => isExpanded ? this.handleExpandLess(userId) : this.handleExpandMore(userId);

	handleExpandMore = userId => e => {
		let expanded = this.state.expanded;
		expanded[userId] = '1';
		this.setState({ expanded });
		if(this.state.subsets && this.state.subsets.hasOwnProperty(userId))
			return true;
		this.getSubsets(userId);
	};

	handleExpandLess = userId => e => {
		let expanded = this.state.expanded;
		delete expanded[userId];
		this.setState({ expanded }); 
	};

	isUserSelected = userId => {
		let selectedUsers = this.props.getSelectedUsers();
		return selectedUsers && selectedUsers.hasOwnProperty(userId);
	};

	isSubsetSelected = (userId, subsetId) => {
		let selectedUsers = this.props.getSelectedUsers();
		return selectedUsers && (
			selectedUsers.hasOwnProperty(subsetId) ||
			(selectedUsers.hasOwnProperty('all') && selectedUsers.all.hasOwnProperty(userId))
		);
	};

	isIndeterminate = user => {
		// It has to be Indetermined when: atleast 1 of the subsets selected AND parent's NOT selected
		const selectedUsers = this.props.getSelectedUsers();
		const isUserSelected = selectedUsers.hasOwnProperty(user.user_id);
		const isAllSubsetsSelected = selectedUsers.hasOwnProperty('all') && selectedUsers.all.hasOwnProperty(user.user_id);
		let isAnyIndividualSubsetSelected = false;
		const is = Object.keys(selectedUsers);
		for(let i = 0; i < is.length; i++){
			let key = is[i];
			if(selectedUsers[key].p === user.user_id) {
				isAnyIndividualSubsetSelected = true;
				break;
			}
		}
		
		if(!isUserSelected && (isAllSubsetsSelected || isAnyIndividualSubsetSelected))
			return true;
		return false;
	};

	handleSelectAllClick = users => e => {
		let selectedUsers = this.props.getSelectedUsers();
		if(Object.keys(selectedUsers).length > 0){
			selectedUsers = {};
		}else{
			selectedUsers = {all: {}};
			Object.assign(selectedUsers, users.reduce((acc, user, i) => {
				// Select user
				acc[user.user_id] = {fn: user.full_name};
				// Select All subsets
				if(user.subset_count > 0)
					Object.assign(selectedUsers.all, {[user.user_id]: user.full_name});
				return acc;
			}, {}));
		}

		this.props.setSelectedUsers(selectedUsers);
	};

	handleSelectUserClick = (e, user) => {
		const selectedUsers = this.props.getSelectedUsers();
		const alreadySelected = this.isUserSelected(user.user_id);

		if(alreadySelected) {
			delete selectedUsers[user.user_id];
			this.deselectAllSubsets(selectedUsers, user.user_id);
		}
		else {
			selectedUsers[user.user_id] = {fn: user.full_name};
			if(user.subset_count > 0)
				this.selectAllSubsets(selectedUsers, user.user_id);
		}
		this.props.setSelectedUsers(selectedUsers);
	};

	handleSelectSubsetClick = (e, userId, subset) => {
		if(!this.state.subsets.hasOwnProperty(userId))
			return false;
		const selectedUsers = this.props.getSelectedUsers();
		const alreadySelected = this.isUserSelected(subset.user_id);
		const allSelected = selectedUsers.hasOwnProperty('all') && selectedUsers.all.hasOwnProperty(userId);
		// const subsetLength = Object.keys(this.state.subsets[userId]).length;

		// Select all other subsets
		if(allSelected){
			let user = this.state.subsets[userId].reduce((acc, s) => {
					acc[s.user_id] = {fn: s.full_name, p: userId};
					return acc;
				}, {});
			user = user ? user : {};
			delete user[subset.user_id];
			delete selectedUsers.all[userId];
			Object.assign(selectedUsers, user);
		}
		// Deselect subset
		else if(alreadySelected) {
			delete selectedUsers[subset.user_id];
		}
		// Select subset, Select all if all of them selected
		else {
			// Add to list
			selectedUsers[subset.user_id] = {fn: subset.full_name, p: userId};

			// Check to see if all subsets selected
			if(!this.isAllSubsetsSelected(selectedUsers, userId)) {
				this.props.setSelectedUsers(selectedUsers);
				return false;
			}
			else{
				this.state.subsets[userId].forEach(s => {
					delete selectedUsers[s.user_id];
				});
			}
			selectedUsers.all = selectedUsers.all ? selectedUsers.all : {};
			Object.assign(selectedUsers.all, {[userId] : this.getLoadedUserById(userId).full_name});
		}
		this.props.setSelectedUsers(selectedUsers);
	};

	isAllSubsetsSelected = (selectedUsers, userId) => {
		let subs = this.state.subsets[userId];
		let ids = Object.keys(selectedUsers);
		for(let i in subs){
			if(!ids.includes(subs[i].user_id.toString())) {
				return false;
			}
		}
		return true;
	};

	selectAllSubsets = (selectedUsers, userId) => {
		if(!selectedUsers.hasOwnProperty('all'))
			selectedUsers['all'] = {};
		selectedUsers.all[userId] = selectedUsers[userId].fn;
	}

	deselectAllSubsets = (selectedUsers, userId) => {
		selectedUsers.hasOwnProperty('all') && selectedUsers.all.hasOwnProperty(userId)
			&& delete selectedUsers.all[userId];
		const keys = Object.keys(selectedUsers);
		keys.forEach(key => {
			const u = selectedUsers[key];
			if(u.p && u.p > 0)
				delete selectedUsers[key];
		});
	}

	handleSwalError = err => {
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: {
				text: 'باشه',
			}
		});
	}

	// Admin
	changeRole = (user, isSubset, role) => {
		if(isSubset) {
			if(!this.state.subsets || !this.state.subsets[user.parent_id])
				return this.handleSwalError(new Error('زیرمجموعه وجود ندارد'));

			let subsets = this.state.subsets;
			subsets[user.parent_id] = subsets[user.parent_id].map(u => {
				if(u.user_id === user.user_id)
					u.role = role;
				return u;
			});
			this.setState({ subsets });
		}
		else {
			const users = this.state.users.map(u => {
				if(u.user_id === user.user_id)
					u.role = role;
				return u;
			});
			this.setState({ users });
		}
	};

	addAdmin = (user, isSubset, role) => {
		this.changeRole(user, isSubset, role);
		let admins = this.state.admins;
		admins.push(user);
		const userIndex = admins.length - 1;
		const adminCount = this.state.adminCount + 1;
		this.setState({ admins, adminCount });
		return userIndex;
	};

	removeAdmin = (user, isSubset, role) => {
		this.changeRole(user, isSubset, role);
		let userIndex = -1;
		let admins = this.state.admins.filter((a, i) => {
			if(a.user_id !== user.user_id)
				return a;
			userIndex = i;
			return false;
		});
		const adminCount = this.state.adminCount - 1;
		this.setState({ admins, adminCount });
		return userIndex;
	};

	rollbackAddAdmin = (user, isSubset, role, adminIndex) => {
		this.changeRole(user, isSubset, role);
		let admins = this.state.admins;
		admins.splice(adminIndex, 1);
		const adminCount = this.state.adminCount - 1;
		this.setState({ admins, adminCount });
	};

	rollbackRemoveAdmin = (user, isSubset, role, adminIndex) => {
		this.changeRole(user, isSubset, role);
		let admins = this.state.admins;
		admins.splice(adminIndex, 0, user);
		const adminCount = this.state.adminCount + 1;
		this.setState({ admins, adminCount });
	};

	addToAdmin = (user, isSubset) => e => {
		swal({
			icon: 'warning',
			text: `مدیر میتواند به اطلاعات بانک و کاربران دسترسی داشته باشد\nاز مدیر شدن «${user.full_name}» مطمئن هستید؟`,
			dangerMode: true,
			buttons: {
				cancel: {
					value: null,
					text: 'نه',
					visible: true
				},
				confirm: {
					value: true,
					text: 'آره',
				},
			}
		}).then(value => {
			if(value){
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'admins';
				const url = `/banks/${bankUsername}/${key}`;
				const oldRole = user.role;
				const formData = new FormData();
				formData.set('id', user.user_id);
				const adminIndex = this.addAdmin(user, isSubset, 'BankAdmin');
				const cb = {
					error: err => {
						// Rollback
						this.rollbackAddAdmin(user, isSubset, oldRole, adminIndex);
						this.handleSwalError(err);
					},
					succeed: result => {}
				};
				API.Result(cb, this.API.post({ url, formData, key }));
			}
		});
	};

	removeFromAdmin = (user, isSubset) => e  => {
		swal({
			icon: 'warning',
			text: `از تنزیل «${user.full_name}» به کاربر عادی اطمینان دارید؟`,
			dangerMode: true,
			buttons: {
				cancel: {
					value: null,
					text: 'نه',
					visible: true
				},
				confirm: {
					value: true,
					text: 'آره',
				},
			}
		}).then(value => {
			if(value){
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'admins';
				const url = `/banks/${bankUsername}/${key}/${user.user_id}`;
				const oldRole = user.role;
				const adminIndex = this.removeAdmin(user, isSubset, null);
				const cb = {
					error: err => {
						// Rollback
						this.rollbackRemoveAdmin(user, isSubset, oldRole, adminIndex);
						this.handleSwalError(err);
					},
					succeed: result => {}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	// User
	deleteUser = (user, isSubset) => {
		let userIndex = -1;
		if(isSubset){
			if(!this.state.subsets || !this.state.subsets[user.parent_id])
				return this.handleSwalError(new Error('زیرمجموعه وجود ندارد'));

			// Delete subset
			let subsets = this.state.subsets;
			subsets[user.parent_id] = subsets[user.parent_id].filter((u, i) => {
				if(u.user_id !== user.user_id)
					return u;
				userIndex = i;
				return false;
			});
			// Decrease subset count
			const users = this.state.users.map(u => {
				if(u.user_id === user.parent_id) {
					u.subset_count -= 1;
				}
				return u;
			});
			// Delete subsets if non exists
			const expanded = this.state.expanded;
			if(subsets[user.parent_id].length <= 0){
				delete subsets[user.parent_id];
				delete expanded[user.parent_id];
			}
			this.setState(prev => ({
				subsets,
				users,
				expanded,
				userCount: prev.userCount-1,
				adminCount: user.role === 'BankAdmin' ? prev.adminCount-1 : prev.adminCount
			}));
		} else {
			let users = this.state.users.filter((u, i) => {
				if(u.user_id !== user.user_id)
					return u;
				userIndex = i;
				return false;
			});
			this.setState(prev => ({
				users,
				userCount: prev.userCount-1,
				adminCount: user.role === 'BankAdmin' ? prev.adminCount-1 : prev.adminCount
			}));
		}
		return userIndex;
	};

	rollbackUser = (user, isSubset, userIndex) => {
		if(isSubset){
			// Rollback subsets
			let subsets = this.state.subsets;
			if(!subsets[user.parent_id])
				subsets[user.parent_id] = [];
			subsets[user.parent_id].splice(userIndex, 0, user);

			// Increase sbset count
			const users = this.state.users.map(u => {
				if(u.user_id === user.parent_id)
					u.subset_count += 1;
				return u;
			});

			// Expand subsets
			const expanded = this.state.expanded;
			expanded[user.parent_id] = '1';
			this.setState(prev => ({
				subsets,
				users,
				expanded,
				userCount: prev.userCount+1,
				adminCount: user.role === 'BankAdmin' ? prev.adminCount+1 : prev.adminCount
			}));
		} else {
			let users = this.state.users;
			users.splice(userIndex, 0, user);
			this.setState(prev => ({
				users,
				userCount: prev.userCount+1,
				adminCount: user.role === 'BankAdmin' ? prev.adminCount+1 : prev.adminCount
			}));
		}
	};

	handleDeleteUser = (user, isSubset) => e => {
		swal({
			icon: 'warning',
			text: `آیا از بستن حساب و حذف «${user.full_name}» اطمینان دارید؟`,
			dangerMode: true,
			buttons: {
				cancel: {
					value: false,
					text: 'نه',
					visible: true
				},
				confirm: {
					value: true,
					text: 'آره',
				},
			}
		}).then(value => {
			if(value){
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'clients';
				// const url = `/banks/${bankUsername}/${key}/${user.user_id}`;
				const url = `/banks/${bankUsername}/${key}/${user.id}`;
				const userIndex = this.deleteUser(user, isSubset);
				const cb = {
					error: err => {
						// Rollback
						this.rollbackUser(user, isSubset, userIndex);
						this.handleSwalError(err);
					},
					succeed: result => {
						const page = this.props.match.params.currentPage;
						this.getUsers(bankUsername)(page);
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	// Subset
	openSubsetDialog = user => e => {
		this.setState({
			subsetDialogUser: user,
			isSubsetDialogOpen: true,
		});
		if(!this.state.subsets || !this.state.subsets.hasOwnProperty(user.user_id)){
			this.getSubsets(user.user_id);
		}
	};

	addSubset = (parentId, subset) => {
		const subsets = this.state.subsets || {};
		const childs = subsets[parentId] || [];
		childs.push(subset);
		subsets[parentId] = childs;
		const users = this.state.users.filter(u => {
			// Increase subset_count
			if(u.user_id === parentId)
				u.subset_count = u.subset_count ? u.subset_count + 1 : 1;

			// Delete Subset from Users
			if(u.user_id !== subset.user_id)
				return u;
			return false;
		});
		this.setState({ users, subsets });
	};

	handleAddSubset = parentId => subset => {
		// Add subset
		this.addSubset(parentId, subset);
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/${parentId}`;
		const formData = new FormData();
		formData.set('id', subset.user_id);
		const cb = {
			error: err => {
				// Rollback
				this.deleteSubset(parentId, subset);
				this.handleSwalError(err);
			},
			succeed: result => {}
		};
		API.Result(cb, this.API.put({ url, key, formData }));
	};

	deleteSubset = (parentId, subset) => {
		// Delete subset
		const subsets = this.state.subsets || {};
		const childs = subsets[parentId] || [];
		subsets[parentId] = childs.filter(c => c.user_id !== subset.user_id);

		// Decrease subset_count
		const users = this.state.users.map(u => {
			if(u.user_id === parentId)
				u.subset_count -= 1;
			return u;
		});

		// Add Subset to Users
		/* if(this.state.users.length < 9)
			users.push(subset); */
		this.setState({ users, subsets });
	};

	handleDeleteSubset = (parentId, subset) => e => {
		this.deleteSubset(parentId, subset);
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/${parentId}/subsets/${subset.user_id}`;
		const cb = {
			error: err => {
				// Rollback
				this.addSubset(parentId, subset);
				this.handleSwalError(err);
			},
			succeed: result => {}
		};
		API.Result(cb, this.API.delete({ url, key }));
	};

	handleCloseSubset = () => {
		const expanded = this.state.expanded || {};
		const subsets = this.state.subsets || {};
		const user = this.state.subsetDialogUser;
		delete subsets[user.user_id];
		delete expanded[user.user_id];
		this.setState({
			isSubsetDialogOpen: false,
			subsetDialogUser: null,
			expanded,
			subsets,
		});
		const page = this.props.match.params.currentPage;
		this.getUsers(this.props.match.params.bankUsername)(page);
	};

	handleSearch = e => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const type = encodeURIComponent(formData.get('type'));
		const value = encodeURIComponent(formData.get('value'));
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/?type=${type}&value=${value}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					users: result.data.users,
					total: result.data.users.length,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	// Info
	getInfo = bankUsername => {
		const key = 'info';
		const url = `/banks/${bankUsername}/${key}`;
		const cb = {
			error: this.handleError,
			limited: this.handleError,
			succeed: (result => {
				this.setState({
					admins: result.data.admins.admins,
					adminCount: result.data.admins.admin_count,
					transactionBalance: result.data.balance,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};


	componentDidMount = () => {
		this.API = new API();
		const bankUsername = this.props.match.params.bankUsername;
		const page = this.props.match.params.currentPage;
		this.getInfo(bankUsername);
		this.getUsers(bankUsername)(page);
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
		} = this.props;

		const {
			error,
			users,
			userCount,
			subsets,
			expanded,
			transactionBalance,
			admins,
			adminCount,
			rowsPerPage,
		} = this.state;

		const page = this.props.match.params.currentPage || 1;
		const bankUsername = this.props.match.params.bankUsername;

		return (
			<ErrorBoundary error={error} reload={() => this.getUsers(bankUsername)(page)}>
				<Grid container spacing={16}>
					{transactionBalance
						? <Grid item xs={12} sm={6} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='وام‌های اعطا شده' />
									<CardContent className={classes.cardContent}>
										<Typography className={classes.balance} variant='display1' color='inherit'>
											{utils.money(transactionBalance.l_co || 0)} <Typography className={classes.inline} component='span' variant='caption'>عدد</Typography>
										</Typography>
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Typography variant='caption'>
													تسویه شده: {utils.money(transactionBalance.fpl_co || 0)} عدد
												</Typography>
											</Grid>
											<Grid item xs>
												<Typography className={classes.textLeft} variant='caption'>
													تسویه نشده: {utils.money((transactionBalance.l_co || 0) - (transactionBalance.fpl_co || 0))} عدد
												</Typography>
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
						: <Grid item xs={12} sm={6} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='موجودی' />
									<CardContent className={classes.cardContent}>
										<Square width={120} height={30} className={classNames(classes.marginTop, classes.center)} />
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Square width={60} height={25} className={classes.center} />
											</Grid>

											<Grid item xs>
												<Square width={60} height={25} className={classes.center} />
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
					}

					{transactionBalance
						? <Grid item xs={12} sm={6} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='موجودی ' />
									<CardContent className={classes.cardContent}>
										<Typography className={classes.balance} variant='display1' color='inherit'>
											<span style={{ direction: 'ltr', display: 'inline-block', marginLeft: 4 }}>{utils.money(transactionBalance.b_ba ? transactionBalance.b_ba : 0)}</span>
											<Typography className={classes.inline} component='span' variant='caption'> تومان</Typography>
										</Typography>
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Tooltip title='درآمد حاصل از کارمزد وام‌ها'>
													<Typography variant='caption'>
														کارمزد: {utils.money(transactionBalance.c_ba ? transactionBalance.c_ba : 0)} تومان
													</Typography>
												</Tooltip>
											</Grid>

											<Grid item xs>
												<Tooltip title='درآمد حاصل از دیرکرد وام‌ها'>
													<Typography className={classes.textLeft} variant='caption'>
														دیرکرد: {utils.money(transactionBalance.p_ba ? transactionBalance.p_ba : 0)} تومان
													</Typography>
												</Tooltip>
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
						: <Grid item xs={12} sm={6} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='موجودی' />
									<CardContent className={classes.cardContent}>
										<Square width={120} height={30} className={classNames(classes.marginTop, classes.center)} />
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Square width={60} height={25} className={classes.center} />
											</Grid>

											<Grid item xs>
												<Square width={60} height={25} className={classes.center} />
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
					}

					{admins
						? <Grid item xs={12} sm={12} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='مدیران' />
									<CardContent className={classes.cardContent}>
										<List className={classes.admins}>
											{admins.map(admin => (
												<ListItem className={classes.admin} key={admin.full_name}>
													{/*isAdmin &&
														<ListItemSecondaryAction classes={{root: classes.itemSecondaryActionRoot}}>
															<Tooltip placement='right' title='حذف از مدیریت'>
																<IconButton  onClick={this.handleDeleteAdmin(admin.user_id)} aria-label='حذف'>
																	<DeleteIcon />
																</IconButton>
															</Tooltip>
														</ListItemSecondaryAction>
														*/}
													<p className={classes.role}>{this.props.types.user.bank[admin.role]}</p>
													<ListItemText className={classes.name} primary={admin.full_name} secondary={admin.phone} />
												</ListItem>
											))}
										</List>
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Typography variant='caption'>
													مدیران: {adminCount} نفر
												</Typography>
											</Grid>
											<Grid item xs>
												<Typography className={classes.textLeft} variant='caption'>
													اعضا: {userCount ? userCount : 0} نفر
												</Typography>
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
						: <Grid item xs={12} sm={12} md>
								<Card className={classes.paper} raised>
									<CardHeader className={classes.cardHeader} subheader='مدیران' />
									<CardContent className={classes.cardContent}>
										<List className={classes.admins}>
											{[...Array(1)].map((i, n) => (
												<ListItem key={n}>
														<ListItemSecondaryAction classes={{root: classes.itemSecondaryActionRoot}}>
															<Circle diameter={30} style={{marginTop: 8}} />
														</ListItemSecondaryAction>
													<Square width='70%' height={32} />
												</ListItem>
											))}
										</List>
									</CardContent>
									<CardActions>
										<Grid container>
											<Grid item xs>
												<Square className={classes.center} width={40} height={20} />
											</Grid>
											<Grid item xs>
												<Square className={classes.center} width={46} height={20} />
											</Grid>
										</Grid>
									</CardActions>
								</Card>
							</Grid>
					}
				</Grid>

				<Paper className={classes.searchForm}>
					<form onSubmit={this.handleSearch}>
						<Grid container spacing={16}>
							<Grid item xs={12} md={5}>
								<TextField
									label='جستجوی کاربر'
									name='value'
									fullWidth
								/>
							</Grid>
							<Grid item xs={8} md={5}>
								<TextField
									label='براساس'
									name='type'
									fullWidth
									select
									onChange={this.handleChange('searchType')}
									value={this.state.searchType}
									className={classes.searchType}>
									<MenuItem value="name">نام و نام خانوادگی</MenuItem>
									<MenuItem value="phone">تلفن همراه</MenuItem>
									<MenuItem value="username">نام کاربری</MenuItem>
									<MenuItem value="id">شماره کاربری</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={4} md={2} style={{ alignSelf: 'flex-end' }}>
								<Button
									type="submit"
									fullWidth
								>جستجو</Button>
							</Grid>
						</Grid>
					</form>
				</Paper>

				<Paper>
					{users 
						? <UsersReady
								columnData={columnData}
								users={users}
								subsets={subsets}
								expanded={expanded}
								isSubsetSelected={this.isSubsetSelected}
								isUserSelected={this.isUserSelected}
								isIndeterminate={this.isIndeterminate}
								getSelectedUsers={this.props.getSelectedUsers}
								handleSelectSubsetClick={this.handleSelectSubsetClick}
								handleSelectUserClick={this.handleSelectUserClick}
								handleSelectAllClick={this.handleSelectAllClick}
								handleExpand={this.handleExpand}
								bankUsername={bankUsername}
								getSearchTransactions={this.props.getSearchTransactions}
								setSearchTransactions={this.props.setSearchTransactions}
								handleOpenSnack={this.props.handleOpenSnack}
								getUserId={this.props.getUserId}
								history={this.props.history}
								addToAdmin={this.addToAdmin}
								removeFromAdmin={this.removeFromAdmin}
								handleDeleteUser={this.handleDeleteUser}
								openSubsetDialog={this.openSubsetDialog}
								handleAddSubset={this.handleAddSubset}
								handleDeleteSubset={this.handleDeleteSubset}
								handleSaveSubset={this.handleSaveSubset}
								handleCloseSubset={this.handleCloseSubset}
								isSubsetDialogOpen={this.state.isSubsetDialogOpen}
								subsetDialogUser={this.state.subsetDialogUser}
								rowsPerPage={rowsPerPage}
								page={page}
								userCount={userCount}
								userRole={this.props.userRole}
							/>
						: <UsersPlaceholder
								columnData={columnData}
								rowsPerPage={10}
							/>
					}
				</Paper>
			</ErrorBoundary>
		);
	}
}

Users.propTypes = {
	// users: propTypes.array.isRequired,
	// selected: propTypes.array.isRequired,
	// handleShowTransaction: propTypes.func.isRequired,
};
export default withStyles(styles)(Users);
