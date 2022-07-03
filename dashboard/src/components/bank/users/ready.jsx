import React from 'react';
import ReactDOM from 'react-dom';
import propTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import utils from 'utils';

// Elements
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import Hidden from '@material-ui/core/Hidden';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Collapse from '@material-ui/core/Collapse';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import Loading from 'components/loading/button';
import EmptyList from 'components/emptyList';
import Pagination from 'components/pagination';
import UserAutoSuggest from 'components/bank/userAutoSuggest';

// Icons
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import IndeterminateIcon from '@material-ui/icons/Remove';
import ChromeReaderModeIcon from '@material-ui/icons/ChromeReaderMode';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SubsetIcon from '@material-ui/icons/GroupAdd';
import RemoveAdminIcon from '@material-ui/icons/NotInterested';

const height = 96;
const styles = theme => ({
	header: {
		paddingRight: theme.spacing.unit * 2,
		paddingLeft: theme.spacing.unit * 2,
		fontSize: '0.8rem',
		color: '#777',
		'&:after': {
			content: '""',
			display: 'block',
			float: 'none',
			clear: 'both',
		}
	},
	headerCheckBox: {
		marginRight: theme.spacing.unit,
		color: theme.colors.primary(1),
	},
	middleSectionHeader: {
		display: 'flex',
		float: 'right',
		height: height - 20,
		alignItems: 'center',
		width: 'calc(100% - 144px - 76px)',
		[theme.breakpoints.down('xs')]: {
			width: 'calc(100% - 56px)',
			'&:after': {
				content: '""',
				display: 'block',
				clear: 'both',
			},
		}
	},
	row: {
		minHeight: height,
		borderBottom: '1px solid #eee',
		'&:nth-child(even)': {
			background: 'rgba(0, 0, 0, 0.05)',
		},
		'&:hover, &:focus': {
			background: 'rgba(0, 0, 0, 0.09)',
		},
	},
	userPanel: {
		padding: `0 ${theme.spacing.unit*2}px`,
		alignItems: 'center',
		fontSize: '0.8rem',
		[theme.breakpoints.down('xs')]: {
			// height: 78,
		},
		'&:after':{
			content: '""',
			display: 'block',
			clear: 'both',
		},
	},
	rightSection: {
		width: 76,
		marginTop: theme.spacing.unit * 2,
		float: 'right',
		[theme.breakpoints.down('xs')]: {
			width: 56,
		}
	},
	middleSection: {
		display: 'flex',
		float: 'right',
		width: 'calc(100% - 144px - 76px)',
		height,
		[theme.breakpoints.down('xs')]: {
			height: height - 20,
			width: 'calc(100% - 56px)',
			'&:after': {
				content: '""',
				display: 'block',
				clear: 'both',
			},
		}
	},
	leftSection: {
		float: 'left',
		width: 144,
		'&>div': {
			float: 'right',
		},
		[theme.breakpoints.down('xs')]: {
			display: 'flex',
			justifyContent: 'space-between',
			width: '100%',
			float: 'none',
			'&>div': {
				float: 'none',
			},
		}
	},
	avatar: {
		height: 64,
		width: 64,
		lineHeight: '3.6rem',
		fontSize: '2rem',
		color: '#eee',
		cursor: 'pointer',
		background: theme.colors.primary(1),
		[theme.breakpoints.down('xs')]: {
			height: 46,
			width: 46,
		}
	},
	fullName: {
		fontWeight: 500,
	},
	price: {
		direction: 'ltr',
		display: 'inline-block',
		marginLeft: theme.spacing.unit,
	},
	loading: {
		margin: '20px auto',
	},
	expandIconContainer: {
		float:'left',
		marginTop: '1.5rem',
		[theme.breakpoints.down('xs')]: {
			marginTop: 0
		}
	},
	expandIcon: {
		transition: 'transform 0.2s',
	},
	expandIconActive: {
		transform: 'rotate(180deg)',
	},
	expandPanel: {
		maxHeight: 150,
		minHeight: 102,
		'&:after': {
			content: '""',
			display: 'block',
			clear: 'both',
			float: 'none',
		}
	},
	expandItem: {
		position: 'relative',
		float: 'right',
		textAlign: 'center',
		minWidth: 96,
		padding: `${theme.spacing.unit}px ${theme.spacing.unit/2}px`,
		[theme.breakpoints.down('xs')]: {
			minWidth: 72,
		}
	},
	expandAvatar: {
		height: 48,
		width: 48,
		lineHeight: '2.6rem',
		fontSize: '1.5rem',
		color: '#eee',
		cursor: 'pointer',
		background: theme.colors.primary(1),
		[theme.breakpoints.down('xs')]: {
			height: 32,
			width: 32,
		}
	},
	expandCollapse: {
		// overflow: 'visible',
		clear: 'both',
		float: 'none',
	},
	expandEmpty: {
		color: '#999',
		fontWeight: 200,
		fontSize: '1rem',
		textAlign: 'center',
		marginBottom: theme.spacing.unit * 3,
	},
	contextMenu: {
		[theme.breakpoints.down('xs')]: {
			display: 'flex',
			flexDirection: 'row',
		}
	},
	userContextMenu: {
		display: 'flex',
		flexDirection: 'row',
		height: 96,
		justifyContent: 'center',
		alignItems: 'center',
	},
	contextMenuSubset: {
		position: 'absolute',
		bottom: 80,
		// right: 96,
		background: '#777',
		border: '3px solid #333',
		borderRadius: 5,
		width: 96,
		zIndex: 9999999,
		'&:after': {
			content: '""',
			position: 'absolute',
			bottom: -9,
			// top: 98,
			right: 40,
			borderTop: '6px solid #333',
			borderLeft: '6px solid transparent',
			borderRight: '6px solid transparent',
		}
	},
	dialog: {
		'@media (min-width: 500px)': {
			minWidth: 500,
			minHeight: '40vh',
		}
	},
	chip: {
		marginLeft: theme.spacing.unit * 2,
		marginTop: theme.spacing.unit
	}
});

class UsersReady extends React.Component{
	state = {
		busySaveSubset: false,
		busyAddSubset: false,
		errorAddSubset: false,
		contextId: 0,
	};

	getHeaderCheckBoxStatus = () => {
		const selectedUsers = this.props.getSelectedUsers();
		// Delete ALL obj
		delete selectedUsers.all;
		// Delete subsets
		let keys = Object.keys(selectedUsers);
		for(let i in keys){
			let key = keys[i];
			if(selectedUsers[key].p && selectedUsers[key].p > 0)
				delete selectedUsers[key];
		}
		// Count new subsets
		const selectedCount = Object.keys(selectedUsers).length;
		const userCount = this.props.users ? this.props.users.length : 0;
		return {
			checked: selectedCount === userCount,
			indeterminate: selectedCount > 0 && selectedCount < userCount
		};
	};

	handleShowTransactions = user => e => {
		const bankUsername = this.props.bankUsername;
		const search = this.props.getSearchTransactions();
		search.uid = {
			value: user.user_id,
			name: user.full_name
		};
		this.props.setSearchTransactions(search);
		this.props.history.push(`/@${bankUsername}/transactions/`);
	};

	handleSubsetShowContext = userId => e => {
		e.preventDefault();
		ReactDOM.findDOMNode(this.collapse).style.overflow = 'visible';
		if(this.state.contextId !== userId)
			this.setState({ contextId: userId});
	};

	handleSubsetCloseContext = e => {
		if(this.collapse)
			ReactDOM.findDOMNode(this.collapse).style.overflow = '';
		if(this.state.contextId)
			this.setState({ contextId: 0});
	};

	renderContextMenu = (isAdmin, n, isSubset) => {
		if(isAdmin)
			return this.handleAdminContextMenu(n, isSubset);
		else
			return this.handleUserContextMenu(n, isSubset);
	};

	handleAdminContextMenu = (n, isSubset) => {
		const classes = this.props.classes;
		const isAdmin = n.role === 'BankAdmin' || n.role === 'Creator';
		const isMine = n.user_id === this.props.getUserId();
		return(
			<div className={isSubset ? classes.contextMenuSubset : classes.contextMenu}>
				<div>
					{!isSubset &&
						<Tooltip placement='top' title='زیرمجموعه‌ها'>
							<IconButton
								onClick={this.props.openSubsetDialog(n)}
								className={classes.promoteUser}>
								<SubsetIcon />
							</IconButton>
						</Tooltip>
					}
					{isAdmin
						? <Tooltip placement='top' title='حذف از مدیریت'>
								<IconButton
									onClick={this.props.removeFromAdmin(n, isSubset)}
									className={classes.promoteUser}>
									<RemoveAdminIcon />
								</IconButton>
							</Tooltip>
						: <Tooltip placement='top' title='ارتقا به مدیر'>
								<IconButton
									onClick={this.props.addToAdmin(n, isSubset)}
									className={classes.promoteUser}>
									<SupervisorAccountIcon />
								</IconButton>
							</Tooltip>
					}
				</div>
				<div>
					<Tooltip placement='bottom' title='گردش حساب'>
						<IconButton
							onClick={this.handleShowTransactions(n)}
							className={classes.transaction}>
							<ChromeReaderModeIcon />
						</IconButton>
					</Tooltip>
					{!isMine
						? <Tooltip placement='bottom' title='حذف کاربر'>
								<IconButton
									className={classes.deleteUser}
									onClick={this.props.handleDeleteUser(n, isSubset)}>
									<DeleteIcon />
								</IconButton>
							</Tooltip>
						: null
					}
				</div>
				{isSubset &&
					<div style={{direction: 'ltr', marginBottom: 8}}>
						<span style={{fontSize: '0.5rem', marginLeft: 4, display: 'block'}}>موجودی</span>
						<Typography>
							{utils.money(n.balance || 0)}
						</Typography>
					</div>
				}
			</div>
		);
	};

	handleUserContextMenu = (n, isSubset) => {
		const classes = this.props.classes;
		const isAdmin = n.role === 'BankAdmin' || n.role === 'Creator';
		const isMine = n.user_id === this.props.getUserId();
		return(
			<div className={isSubset ? classes.contextMenuSubset : classes.userContextMenu}>
				<div>
					<Tooltip placement='bottom' title='گردش حساب'>
						<IconButton
							onClick={this.handleShowTransactions(n)}
							className={classes.transaction}>
							<ChromeReaderModeIcon />
						</IconButton>
					</Tooltip>
				</div>
				{isSubset &&
					<div style={{direction: 'ltr', marginBottom: 8}}>
						<span style={{fontSize: '0.5rem', marginLeft: 4, display: 'block'}}>موجودی</span>
						<Typography>
							{utils.money(n.balance || 0)}
						</Typography>
					</div>
				}
			</div>
		);
	};

	render(){
		const {
			classes,
			handleSelectSubsetClick,
			handleSelectUserClick,
			handleSelectAllClick,
			handleExpand,
			users,
			subsets,
			expanded,
			isSubsetDialogOpen,
			subsetDialogUser,
			rowsPerPage,
			page,
			userCount,
			fullScreen,
		} = this.props;
		const {
			contextId,
		} = this.state;
		const {checked, indeterminate} = this.getHeaderCheckBoxStatus()
		const bankUsername = this.props.bankUsername;
		const base = `/@${bankUsername}`;
		const isAdmin = this.props.userRole === 'Creator' || this.props.userRole === 'BankAdmin';

		return (
			<div>
				<header className={classes.header}>
					<div className={classes.rightSection}>
						<Checkbox
							className={classes.headerCheckBox}
							color='default'
							indeterminate={indeterminate}
							checked={checked}
							onChange={handleSelectAllClick(users)}
						/>
					</div>
					<div className={classes.middleSectionHeader}>
						<Grid container>
							<Grid item xs={12} sm={7} md={4}>نام و نام خانوادگی</Grid>
							<Hidden xsDown>
								<Grid item sm={5} md={4}>موجودی فعلی</Grid>
							</Hidden>
							<Hidden smDown>
								<Grid item md={2}>تاریخ عضویت</Grid>
							</Hidden>
							<Grid item md={2}>
							</Grid>
						</Grid>
					</div>
				</header>
				<EmptyList noShadow data={users}>
					{users.map(n => {
						const isSelected = this.props.isUserSelected(n.user_id);
						const isIndeterminate = isSelected ? false : this.props.isIndeterminate(n);
						const isExpanded = expanded.hasOwnProperty(n.user_id);
						return(
							<div key={n.user_id} className={classes.row} onClick={this.handleSubsetCloseContext}>
								<div className={classes.userPanel}>
									<div
										onClick={e => handleSelectUserClick(e, n)}
										className={classes.rightSection}
										padding="checkbox">
										<Tooltip title={isSelected ? 'حذف انتخاب خود' :
											isIndeterminate ? 'حذف انتخاب زیرمجموعه‌ها' : 'انتخاب'}>
											<IconButton className={classes.avatar}>
												{isIndeterminate
													? <Avatar className={classes.avatar} alt={`${n.full_name.charAt(0)}`}>
															<IndeterminateIcon />
														</Avatar>
													: isSelected
														? <Avatar className={classes.avatar} alt={`${n.full_name.charAt(0)}`}>
																<DoneIcon />
															</Avatar>
														: <Avatar className={classes.avatar} src={utils.avatar.user(n.avatar, n.phone)} alt={n.full_name.charAt(0)} />
												}
											</IconButton>
										</Tooltip>
									</div>
									<div
										onClick={e => handleSelectUserClick(e, n)}
										className={classes.middleSection}>
										<Grid container style={{alignItems: 'center'}}>
											<Grid className={classes.fullName} item xs={12} sm={7} md={4}>{n.full_name}</Grid>
											<Hidden xsDown>
												<Grid item sm={5} md={4} lg={4}>
													<span className={classes.price}>{utils.money(n.balance ? n.balance : 0)}</span>
													تومان
												</Grid>
											</Hidden>
											<Hidden smDown>
												<Grid item md={2} lg={3}>{utils.Miladi2Shamsi(n.created_at, 'jYYYY/jMM/jDD')}</Grid>
											</Hidden>
										</Grid>
									</div>
									<div className={classes.leftSection}>
										{this.renderContextMenu(isAdmin, n)}
										{n.subset_count
											? <div className={classes.expandIconContainer}>
													<IconButton
														onClick={handleExpand(n.user_id, isExpanded)}>
														<ExpandMoreIcon
															className={classNames(classes.expandIcon, isExpanded && classes.expandIconActive)} />
													</IconButton>
												</div>
											: null
										}
									</div>
								</div>

								{n.subset_count
									? <Collapse in={isExpanded} ref={ref => this.collapse = ref} className={isExpanded ? classes.expandCollapse : ''}>
											<section className={classes.expandPanel}>
												{subsets && subsets[n.user_id]
													? subsets[n.user_id].length > 0
														? subsets[n.user_id].map(subset => {
																const isSubsetSelected = this.props.isSubsetSelected(n.user_id, subset.user_id);
																const showContext = contextId === subset.user_id;
																return(
																	<div
																		key={subset.user_id}
																		onMouseEnter={this.handleSubsetShowContext(subset.user_id)}
																		onMouseLeave={this.handleSubsetCloseContext}
																		className={classes.expandItem}>
																		<Checkbox
																			className={classes.expandAvatar}
																			checked={isSubsetSelected}
																			onClick={e => handleSelectSubsetClick(e, n.user_id, subset)}
																			onContextMenu={this.handleSubsetShowContext(subset.user_id)}
																			color='default'
																			checkedIcon={
																				<Avatar
																					className={classes.expandAvatar}
																					alt={subset.full_name.charAt(0)}>
																					<DoneIcon />
																				</Avatar>
																			}
																			icon={
																				<Avatar
																					className={classes.expandAvatar}
																					src={utils.avatar.user(subset.avatar, subset.phone)}
																					alt={subset.full_name.charAt(0)} />
																			}
																		/>
																		<Typography variant='caption'>
																			{subset.full_name}
																		</Typography>
																		{showContext && this.renderContextMenu(isAdmin, subset, true)}
																	</div>
																);
															})
														: <Typography className={classes.expandEmpty}>زیرمجموعه‌ای وجود ندارد</Typography>
													: <Loading className={classes.loading} color='#ccc' show={isExpanded} width={48} height={48} />
												}
											</section>
										</Collapse>
									: null
								}
							</div>
						);
					})}
				</EmptyList>

				{subsetDialogUser &&
					<Dialog
						fullScreen={fullScreen}
						open={isSubsetDialogOpen}
						onClose={this.props.handleCloseSubset}>
							<DialogTitle>
								{subsetDialogUser.full_name}
							</DialogTitle>
							<DialogContent className={classes.dialog}>
								<DialogContentText>
									برای افزودن زیرمجموعه، نام افراد را وارد کنید
								</DialogContentText>
								<UserAutoSuggest
									exclude={subsets && subsets.hasOwnProperty(subsetDialogUser.user_id)
											? subsets[subsetDialogUser.user_id].map(u=>u.user_id).concat(subsetDialogUser.user_id)
											: [subsetDialogUser.user_id]}
									bankUsername={this.props.bankUsername}
									margin='normal'
									onClick={this.props.handleAddSubset(subsetDialogUser.user_id)} />
								<div className={classes.subsets}>
									{subsets && subsets.hasOwnProperty(subsetDialogUser.user_id)
										? <EmptyList noShadow content='زیرمجموعه‌ای وجود ندارد' data={subsets[subsetDialogUser.user_id]}>
												{subsets[subsetDialogUser.user_id].map(subset => (
													<Chip
														key={subset.user_id}
														className={classes.chip}
														label={subset.full_name}
														onDelete={this.props.handleDeleteSubset(subsetDialogUser.user_id, subset)}
													/>
												))}
											</EmptyList>
										: <Loading
												className={classes.loading}
												show={true}
												height={32}
												width={32}
											/>
									}
								</div>
							</DialogContent>
							<DialogActions>
								<Button
									color='secondary'
									onClick={this.props.handleCloseSubset}>
									بستن
								</Button>
								{/*<Button
									color='primary'
									onClick={this.props.handleSaveSubset}>
									ذخیره
									<Loading
										show={busySaveSubset}
										color='#eee'
									/>
								</Button>*/}
							</DialogActions>
					</Dialog>
				}
					<Pagination
						base={base}
						rowsPerPage={rowsPerPage}
						currentPage={page}
						total={userCount}
					/>
			</div>
		);
	}
}

UsersReady.propTypes = {
	users: propTypes.array.isRequired,
};
export default withMobileDialog()(withStyles(styles)(UsersReady));
