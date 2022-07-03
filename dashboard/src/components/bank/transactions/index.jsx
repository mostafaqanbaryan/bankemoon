import API from 'api';
import React from 'react';
import LoanClass from 'loan';
import { withStyles } from '@material-ui/core/styles';
import propTypes from 'prop-types';
import classNames from 'classnames';
import swal from 'sweetalert';
import utils from 'utils';

// Elements
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Hidden from '@material-ui/core/Hidden';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Collapse from '@material-ui/core/Collapse';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

import Title from 'components/title';
import Square from 'components/square';
import Loading from 'components/loading/button';
import DateInput from 'components/dateInput';
import EmptyList from 'components/emptyList';
import ErrorBoundary from 'components/errorBoundary';
import InfiniteScroll from 'components/infiniteScroll';
import UserAutoSuggest from 'components/bank/userAutoSuggest';

// Icons
import DeleteIcon from '@material-ui/icons/Clear';
import AcceptIcon from '@material-ui/icons/Done';
import PDFIcon from '@material-ui/icons/PictureAsPdf';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

// Colors
import Green from '@material-ui/core/colors/green';
import Teal from '@material-ui/core/colors/teal';
import Red from '@material-ui/core/colors/red';
import Indigo from '@material-ui/core/colors/indigo';

const styles = theme => ({
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
	searchContainer: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	searchText: {
		fontSize: '0.6rem',
		fontWeight: 200,
		paddingRight: theme.spacing.unit*2,
	},
	searchChip: {
		paddingRight: theme.spacing.unit,
		paddingTop: theme.spacing.unit/2,
		paddingBottom: theme.spacing.unit/2,
	},
	searchButton: {
		marginTop: theme.spacing.unit*2,
	},
	searchCollapse: {
		marginBottom: theme.spacing.unit*3,
		padding: `0 ${theme.spacing.unit*2}px`
	},
	menuIcon: {
		verticalAlign: 'middle',
		opacity: 0.6,
		paddingLeft: theme.spacing.unit,
		width: 18,
		height: 18,
	},
	searchGrid: {
		alignItems: 'flex-end',
		margin: `${theme.spacing.unit*2}px 0`,
		'& > *': {
			padding: `0 ${theme.spacing.unit}px`,
		}
	},
	transGrid: {
		height: 40,
		fontSize: '0.8rem',
		fontColor: '#555',
		fontWeight: 200,
		[theme.breakpoints.down('sm')]: {
			paddingTop: theme.spacing.unit,
			paddingRight: theme.spacing.unit,
			borderTop: '1px solid #eee'
		}
	},
	center: {
		textAlign: 'center',
	},
	cellType: {
		cursor: 'pointer',
		fontSize: '1.2rem',
		color: '#1287cc',
		borderRadius: '50%',
		filter: 'grayscale(0.5)',
		padding: theme.spacing.unit,
		height: 76,
	},
	date: {
		fontSize: '1.3rem',
		fontWeight: 500,
	},
	year: {
		transform: 'rotate(90deg)',
	},
	cellPrice: {
		fontSize: '0.9rem',
		fontWeight: 600,
	},
	fullName: {
		fontSize: '0.9rem',
		cursor: 'pointer',
	},
	price: {
		direction: 'ltr',
		display: 'inline-flex',
		paddingLeft: 6,
		color: 'inherit',
		fontWeight: 'inherit',
	},
	request: {
		height: '38px',
		width: '38px',
		background: Green.A700,
		'&:hover': {
			background: Green.A400
		}
	},
	avatar: {
		height: '64px',
		width: '64px',
		cursor: 'pointer',
		background: Teal[500]
	},
	panel: {
		borderTop: '1px solid #ccc',
		borderRight: '5px solid',
		'&:nth-child(even)': {
			background: '#f9f9f9',
		}
	},
	row: {
		// height: 96,
		alignItems: 'center',
		// padding: `${theme.spacing.unit*3}px 0`
		padding: `${theme.spacing.unit}px 0`,
		outline: 0,
	},
	accept: {
		color: Green[500],
		'&:hover': {
			color: Green[500]
		}
	},
	transaction:{
		'&:hover': {
			color: Indigo[400]
		}
	},
	chip: {
		marginLeft: theme.spacing.unit * 2,
	}, 
	textCenter: {
		textAlign: 'center',
	},
	small: {
		fontSize: '0.6rem',
	},
	loading: {
		margin: '20px auto',
	},
	expandIcon: {
		transition: 'transform 0.2s',
	},
	expandIconActive: {
		transform: 'rotate(180deg)',
	},
	expandPanel: {
		fontSize: '0.8rem',
		padding: theme.spacing.unit*2,
		// maxHeight: 150,
		minHeight: 48,
		'&:after': {
			content: '""',
			display: 'block',
			clear: 'both',
			float: 'none',
		}
	},
	expandLabel: {
		fontSize: '0.7rem',
		fontWeight: 300,
		paddingLeft: theme.spacing.unit,
		verticalAlign:	'middle',
	},
	expandItem: {
		marginBottom: theme.spacing.unit
	}
});

class Transactions extends React.Component{
	state = {
		loading: false,
		searchLoading: false,
		searchType: 'payment',
		transactions: null,
		showSearch: Object.keys(this.props.getSearchTransactions()).length > 0,
		overflowSearch: Object.keys(this.props.getSearchTransactions()).length > 0,
		search: {},
		expanded: {},
		transaction: {},
		exportAnchor: null,
		isLastPage: false,
		page: 1,
		rowsPerPage: 20,
	}

	handleChange = (name, toggle=false) => e => {
		if(toggle){
			this.setState(prev => ({ [name]: !prev[name] }));
		}else{
			this.setState({ [name]: e.target.value });
		}
	};

	handleError = err => {
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: {
				text: 'باشه',
			}
		});
	};

	handleGetError = err => this.setState({ error: err.message, loading: false, searchLoading: false });

	getSearchQuery = search => {
		if(!search)
			return '?';
		let url = '';
		if(search.type)
			url += search.type.value;
		delete search.type;
		const keys = Object.keys(search);
		url += '?' + keys.reduce((str, k, i) => str += `${k}=${search[keys[i]].value}&`, '');
		return url;
	};

	getTransactions = (bankUsername, search=null, page=1) => {
		this.setState({ loading: true });
		const key = 'getTransactions';
		let url = `/transactions/${bankUsername}/`;
		url += this.getSearchQuery(search);
		url += `&page=${page}`;
		const cb = {
			error: this.handleGetError,
			succeed: result => {
				const isLastPage = result.data.transactions.length < this.state.rowsPerPage;
				const transactions = search
					? result.data.transactions
					: this.state.transactions
						? this.state.transactions.concat(result.data.transactions)
						: result.data.transactions;
				this.setState({
					transactions,
					loading: false,
					searchLoading: false,
					isLastPage,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleExport = format => e => {
		const search = this.props.getSearchTransactions();
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'export';
		let url = `/transactions/${bankUsername}/${key}/`;
		url += this.getSearchQuery(search);
		url += `&output=${format}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				window.location.href = utils.cdn(result.data.path);
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleAccept = transactionId => e => {
		let transaction = this.state.transactions.filter(t => t.id === transactionId);
		if(transaction.length <= 0)
			return this.props.handleOpenSnack({
				message: 'تراکنش یافت نشد',
				variant: 'error',
			});
		transaction = transaction[0];

		swal({
			text: `از صحت تراکنش با مبلغ ${utils.money(Math.abs(transaction.value))} تومان اطمینان دارید؟`,
			icon: 'warning',
			buttons: {
				cancel: {
					value: null,
					visible: true,
					text: 'نه',
				},
				confirm: {
					value: true,
					text: 'آره',
				},
			},
		})
		.then(value => {
			if(value){
				this.acceptChangeStatus(transaction.id, 'Accepted');
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'acceptTransaction';
				const url = `/transactions/${bankUsername}/${transactionId}`;
				const cb = {
					error: err => {
						this.acceptChangeStatus(transaction.id, 'Pending');
						this.handleError(err);
					},
					succeed: result => { }
				};
				API.Result(cb, this.API.patch({ url, key }));
			}
		});
	};

	acceptChangeStatus = (transactionId, status) => {
		const transactions = this.state.transactions.map(t => {
			if(t.id === transactionId)
				t.status = status;
			return t;
		});
		this.setState({ transactions });
	};

	handleDelete = transactionId => e => {
		swal({
			text: 'از حذف تراکنش اطمینان دارید؟',
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					value: null,
					visible: true,
					text: 'نه',
				},
				confirm: {
					value: true,
					text: 'آره',
				},
			},
		})
		.then(value => {
			if(value){
				const temp = this.deleteAction(transactionId);
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'deleteTransaction';
				const url = `/transactions/${bankUsername}/${transactionId}`;
				const cb = {
					error: err => {
						this.deleteRollback(temp.item, temp.index);
						this.handleError(err);
					},
					succeed: result => { }
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	deleteAction = transactionId => {
		let index = 0;
		let item = null;
		const transactions = this.state.transactions.filter((t, i) => {
			if(t.id === transactionId){
				item = t;
				index = i;
				return false;
			}
			return t;
		});
		this.setState({ transactions });
		return { item, index };
	};

	deleteRollback = (temp, index) => {
		const transactions = this.state.transactions;
		transactions.splice(index, 0, temp);
		this.setState({ transactions });
	};

	handleExpand = (transactionId, type, isExpanded) => e =>
		isExpanded ? this.handleExpandLess(transactionId) : this.handleExpandMore(transactionId, type);

	handleExpandMore = (transactionId, type) => {
		let expanded = this.state.expanded;
		let temp = this.state.transactions.filter(t => t.id === transactionId);
		expanded[transactionId] = '1';
		this.setState({ expanded });
		if(temp && temp.length > 0 && temp[0].hasOwnProperty('info'))
			return true;

		const bankUsername = this.props.match.params.bankUsername;
		const key = 'getTransaction';
		const url = `/transactions/${bankUsername}/${type}/${transactionId}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				let transactions = this.state.transactions;
				let transaction = result.data.transaction;
				transaction.options = result.data.options;
				transaction.info = result.data.transaction;
				transactions = transactions.map(t => t.id === transaction.id ? Object.assign(t, transaction) : t);
				this.setState({
					transactions,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleExpandLess = transactionId => {
		let expanded = this.state.expanded;
		delete expanded[transactionId];
		this.setState({ expanded }); 
	};

	handleAddSearch = (key, value, name) => e => {
		const bankUsername = this.props.match.params.bankUsername;
		const search = this.props.getSearchTransactions();
		search[key] = {value, name};
		this.props.setSearchTransactions(search);
		this.setState({ searchLoading: true });
		this.getTransactions(bankUsername, search);
	};

	handleDeleteSearch = (key, value) => e => {
		const bankUsername = this.props.match.params.bankUsername;
		const search = this.props.getSearchTransactions();
		delete search[key];
		this.props.setSearchTransactions(search);
		this.getTransactions(bankUsername, search);
	};
	
	clearSearchTransasctions = () => {
		const bankUsername = this.props.match.params.bankUsername;
		window.sessionStorage.deleteItem('search');
		this.setState({ searchLoading: true });
		this.getTransactions(bankUsername);
	};

	isOld = createdAt => {
		const d = new Date(createdAt);
		const week = 7 * 24 * 60 * 60 * 1000;
		const expire = d.getTime() + week;
		const now = Date.now();
		return now > expire;
	};

	reload = () => {
		const bankUsername = this.props.match.params.bankUsername;
		const search = this.props.getSearchTransactions();
		// const page = this.state.page;
		this.getTransactions(bankUsername, search);
	};

	handleScroll = () => {
		const bankUsername = this.props.match.params.bankUsername;
		const search = this.props.getSearchTransactions();
		const page = this.state.page+1;
		this.getTransactions(bankUsername, search, page);
		this.setState({ page });
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentDidMount = () => {
		this.reload();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
			types,
			role,
		} = this.props;
		const {
			error,
			loading,
			searchLoading,
			transactions,
			expanded,
			showSearch,
			overflowSearch,
			isLastPage,
		} = this.state;
		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}`;
		const search = this.props.getSearchTransactions();
		const searchKeys = Object.keys(search);

		return(
			<ErrorBoundary reload={this.reload} error={error}>
				{transactions
					? <Paper>
							<Title
								label='صورت حساب'
								back={`${base}/`}
								help='/tutorial/'
								padding
								button={<Button
									color='secondary'
									onClick={this.handleExport('pdf')}>
									<PDFIcon className={classes.menuIcon} />
									دریافت خروجی
								</Button>}
							/>
								{searchKeys.length > 0 &&
									<div className={classes.searchContainer}>
										<span className={classes.searchText}>جستجو براساس: </span>
										<div className={classes.searchChip}>
											{searchKeys.map(key =>
												<Chip
													key={key}
													className={classes.chip}
													onDelete={this.handleDeleteSearch(key)}
													label={search[key].name}
												/>
											)}
										</div>
										<Loading show={searchLoading} />
									</div>
								}
								<Button
									fullWidth
									className={classes.searchButton}
									onClick={this.handleChange('showSearch', true)}>
									جستجوی پیشرفته
									<ExpandMoreIcon
										className={classNames(classes.expandIcon, showSearch && classes.expandIconActive)} />
								</Button>
								<Collapse
									className={classes.searchCollapse}
									in={showSearch}
									onExit={this.handleChange('overflowSearch', true)}
									onEntered={this.handleChange('overflowSearch', true)}
									style={{overflow: overflowSearch ? 'visible' : 'hidden'}}>
									<Grid className={classes.searchGrid} container>
										<Grid item xs={12} sm={6} lg={3}>
											<UserAutoSuggest
												onClick={user => this.handleAddSearch('uid', user.id, user.full_name)()}
												fullWidth
												bankUsername={bankUsername}
											/>
										</Grid>
										<Grid item xs={12} sm={6} lg={3}>
											<TextField
												fullWidth
												select
												value={this.state.searchType}
												label='دسته‌بندی'
												onChange={e => {
													this.handleAddSearch('type', e.target.value, types.transaction[e.target.value].value)();
													this.setState({ searchType: e.target.value });
												}}>
												{Object.keys(types.transaction).map(key => (
													<MenuItem key={key} value={key}>
														<Typography>
															{types.transaction[key].value}
														</Typography>
													</MenuItem>
												))}
											</TextField>
										</Grid>
										<Grid item xs={12} sm={6} lg={3}>
											<DateInput
												fullWidth={true}
												onClick={(date, persian) => this.handleAddSearch('start_at', date.getTime(), `از ${persian}`)()}
												label='از تاریخ:' />
										</Grid>
										<Grid item xs={12} sm={6} lg={3}>
											<DateInput
												fullWidth
												onClick={(date, persian) => this.handleAddSearch('end_at', date.getTime(), `تا ${persian}`)()}
												label='تا تاریخ:' />
										</Grid>
									</Grid>
								</Collapse>
								<EmptyList data={transactions}>
									<div>
										<Grid container className={classes.transGrid}>
											<Hidden xsDown>
												<Grid item sm={2} lg={1} className={classes.center}>تاریخ</Grid>
											</Hidden>
											<Hidden xsDown>
												<Grid style={{paddingRight: 8}} item sm={2} lg={2}>دسته‌بندی</Grid>
											</Hidden>
											<Grid item xs={6} sm={4} lg={3}>نام و نام خانوادگی</Grid>
											<Grid item xs={4} sm={3} lg={3}>مبلغ</Grid>
											<Hidden smDown>
												<Grid className={classes.center} item lg={2}>وضعیت</Grid>
											</Hidden>
										</Grid>

										{transactions.map(n => {
											const shamsi = utils.Miladi2ShamsiObject(n.created_at_bank);
											const month = utils.persian.month(shamsi.month);
											const statusText = n.status ? n.status : 'Accepted';
											const status = types.status[statusText];
											const type = types.transaction[n.type] || types.instalment[n.type];
											const isExpanded = expanded.hasOwnProperty(n.id);
											const isOld = this.isOld(n.created_at);
											let loan = null;

											if(isExpanded && n.type === 'loan' && n.options && !n.options.exgratia){
												loan = new LoanClass({
													price: n.value,
													duration: n.options.duration,
													commission: n.options.commission,
													profit: n.options.profit,
												});
												/* const commissions = loan.getCommissions();
												const commission = loan.getCommission();
												const instalment = loan.getInstalment();
												const reimbursement = loan.getReimbursement();
												const profit = loan.getProfit(); */
											}

											return (
												<div className={classes.panel} style={{borderRightColor: type.color, filter: searchLoading ? 'blur(4px)' : ''}} key={n.id}>
													<Grid
														container
														className={classes.row}>
														<Hidden xsDown>
															<Grid item sm={2} lg={1} className={classes.center}>
																<Typography className={classes.date}>
																	{shamsi.year}
																</Typography>
																<Typography>
																	{`${month} ${shamsi.day}`}
																</Typography>
															</Grid>
														</Hidden>
														<Hidden xsDown>
															<Grid item sm={2} lg={2}>
																<Button
																	disabled={searchLoading}
																	className={classes.cellType}
																	style={{color: type.color}}
																	onClick={this.handleAddSearch('type', n.type, type.value)}>
																	{type.value}
																</Button>
															</Grid>
														</Hidden>
														<Grid item xs={6} sm={4} lg={3}>
															<Button
																disabled={searchLoading}
																className={classes.fullName}
																onClick={this.handleAddSearch('uid', n.user_id, n.full_name)}>
																{n.full_name}
															</Button>
														</Grid>
														<Grid item xs={4} sm={3} lg={3} className={classes.cellPrice} style={{color: n.value > 0 ? Green[700] : Red[800]}}>
															<Typography component='span' className={classes.price}>
																{utils.money(n.value)}
															</Typography>
															<Hidden xsDown>
																تومان
															</Hidden>
														</Grid>
														<Hidden smDown>
															{utils.isBankAdmin(role) && !isOld
																? <Grid className={classes.center} item lg={2}>
																		{n.status === 'Pending'
																			? <div>
																					<Tooltip title='تایید تراکنش'>
																						<IconButton disabled={searchLoading} onClick={this.handleAccept(n.id)} color='primary'>
																							<AcceptIcon className={classes.accept} />
																						</IconButton>
																					</Tooltip>
																					<Tooltip title='حذف تراکنش'>
																						<IconButton onClick={this.handleDelete(n.id)} color='secondary'>
																							<DeleteIcon />
																						</IconButton>
																					</Tooltip>
																				</div>
																			: <div>
																					<Button disabled={searchLoading} onClick={this.handleDelete(n.id)} color='secondary'>
																						حذف
																					</Button>
																				</div>
																		}
																		<Typography className={classes.small} variant='caption'>ایجاد توسط {n.creator}</Typography>
																	</Grid>
																: <Grid className={classes.center} item lg={2}>
																		<div>
																			<Typography gutterBottom style={{color: status.color}}>{status.value}</Typography>
																			<Typography className={classes.small} variant='caption'>ایجاد توسط {n.creator}</Typography>
																		</div>
																	</Grid>
															}
														</Hidden>
														<Grid item xs={2} sm={1} lg={1}>
															<div
																className={classes.leftSection}>
																<IconButton
																	disabled={searchLoading}
																	onClick={this.handleExpand(n.id, n.type, isExpanded)}>
																	<ExpandMoreIcon
																		className={classNames(classes.expandIcon, isExpanded && classes.expandIconActive)} />
																</IconButton>
															</div>
														</Grid>
													</Grid>

													<Collapse in={isExpanded} className={classes.expandCollapse}>
														<section className={classes.expandPanel}>
															{n.options
																? <Grid container>
																		<Grid className={classes.expandItem} item xs={12} sm={6}>
																			<span className={classes.expandLabel}>تاریخ تراکنش:</span>
																			{utils.Miladi2Shamsi(n.created_at_bank, 'jYYYY/jMM/jDD')}
																		</Grid>
																		<Grid className={classes.expandItem} item xs={12} sm={6}>
																			<span className={classes.expandLabel}>تاریخ ایجاد:</span>
																			{utils.Miladi2Shamsi(n.created_at, 'HH:mm:ss، jYYYY/jMM/jDD')}
																		</Grid>

																		<Grid className={classes.expandItem} item xs={12} sm={6}>
																			<span className={classes.expandLabel}>نوع تراکنش:</span>
																			{type.value}
																		</Grid>
																		<Grid className={classes.expandItem} item xs={12} sm={6}>
																			<span className={classes.expandLabel}>ایجاد کننده:</span>
																			{n.creator}
																		</Grid>
																		<Grid className={classes.expandItem} item xs={12} sm={6}>
																			<span className={classes.expandLabel}>شماره تراکنش:</span>
																			{n.id}
																		</Grid>
																		{n.options.admin &&
																			<Grid className={classes.expandItem} item xs={12} sm={6}>
																				<span className={classes.expandLabel}>مدیریت توسط:</span>
																				{n.options.admin.full_name}
																			</Grid>
																		}

																		{n.options.description &&
																			<Grid className={classes.expandItem} item xs={12} sm={6}>
																				<span className={classes.expandLabel}>توضیحات تراکنش:</span>
																				{n.options.description}
																			</Grid>
																		}

																		{n.parent_value &&
																			<Grid className={classes.expandItem} item xs={12} sm={12}>
																				<span className={classes.expandLabel}>زیرمجموعه تراکنش:</span>
																				وام {utils.money(Math.abs(n.parent_value))} تومان با {n.parent_duration} قسط
																			</Grid>
																		}

																		{n.options.exgratia &&
																			<Grid className={classes.expandItem} item xs={12} sm={6}>
																				<span className={classes.expandLabel} style={{ fontWeight: 700, color: '#de2d2d'}}>وام بلاعوض</span>
																			</Grid>
																		}

																		{loan && !n.options.exgratia &&
																			<React.Fragment item xs={12}>
																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>مبلغ بازپرداخت : </span>
																					{utils.money(loan.getReimbursement() + (n.options.dailyPenalty || 0))}
																					<span className={classes.expandLabel}> تومان</span>
																				</Grid>
																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>تعداد اقساط		 : </span>
																					{n.options.duration}
																				</Grid>

																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>مبلغ هر قسط:</span>
																					{utils.money(loan.getInstalment())}
																					<span className={classes.expandLabel}> تومان</span>
																				</Grid>
																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>مجموع کارمزد:</span>
																					{utils.money(loan.getCommission())}
																					<span className={classes.expandLabel}> تومان</span>
																				</Grid>

																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>مجموع سود:</span>
																					{utils.money(loan.getProfit())}
																					<span className={classes.expandLabel}> تومان</span>
																				</Grid>
																				<Grid className={classes.expandItem} item xs={12} sm={6}>
																					<span className={classes.expandLabel}>مجموع دیرکرد:</span>
																					{n.options.dailyPenalty ? utils.money(n.options.dailyPenalty) : 0}
																					<span className={classes.expandLabel}> تومان</span>
																				</Grid>
																			</React.Fragment>
																		}
																	</Grid>
																: <Loading className={classes.loading} color='#ccc' show={isExpanded} width={48} height={48} />
															}
														</section>
													</Collapse>
												</div>
											);
										})}
										<InfiniteScroll
											onScroll={this.handleScroll}
											loading={loading}
											isLastPage={isLastPage}
										/>
									</div>
								</EmptyList>
							</Paper>
					: <Paper>
							<Title label='درحال دریافت اطلاعات...' back={`${base}/`} help='/tutorial/' padding />
							<div>
								{[...Array(10)].map((zero, i) => {
									return (
										<Grid
											spacing={16}
											style={{ paddingRight: 16 }}
											container
											className={classes.row}
											tabIndex={-1}
											key={i}>
											<Grid item xs={2} padding="checkbox" className={classNames(classes.center)}>
												<Square height={64} width='100%' />
											</Grid>

											<Grid item xs={5} padding="checkbox">
												<Square height={20} width='100%' />
											</Grid>

											<Grid item xs={5} className={classes.cellPrice}>
												<Square height={20} width='90%' />
											</Grid>
										</Grid>
									);
								})}
							</div>
						</Paper>
				}
			</ErrorBoundary>
		);
	}
}

Transactions.propTypes = {
	types				 : propTypes.object.isRequired,
	// handleSubmit : propTypes.func.isRequired,
};
export default withStyles(styles)(Transactions);
