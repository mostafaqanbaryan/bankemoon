import API from 'api';
import React from 'react';
import Loan from 'loan';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Title from 'components/title';
import BadgeEnhancement from 'components/enhancement/badge';
import utils from 'utils';

// Elements
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Square from 'components/square';
import EmptyList from 'components/emptyList';
import ErrorBoundary from 'components/errorBoundary';
import InfiniteScroll from 'components/infiniteScroll';

// Icons
import SystemUpdateIcon from '@material-ui/icons/SystemUpdateAlt';

// Colors
import Green from '@material-ui/core/colors/green';
import Teal from '@material-ui/core/colors/teal';
import Red from '@material-ui/core/colors/red';
import Indigo from '@material-ui/core/colors/indigo';

const styles = theme => ({
	root: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
	rootCellDate: {
		paddingRight: 0,
	},
	cellDate: {
		textAlign: 'center',
	},
	date: {
		fontSize: '1.3rem',
		fontWeight: 500,
	},
	cellPrice: {
		fontSize: '0.9rem',
		fontWeight: 600,
		color: '#2e62d8'
	},
	cellDebt: {
		fontSize: '0.8rem',
		fontWeight: 600,
		color: Red[700]
	},
	cellDraw: {
		fontSize: '0.8rem',
		fontWeight: 600,
		color: Green[700]
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
	tableRow: {
		height: '96px',
	},
	tableRowDelayed: {
		background: Red[50]+'!important',
		'&:nth-child(odd)': {
			background: Red[100]+'!important',
		}
	},
	tableRowFullyPaid: {
		background: Green[50]+'!important',
		'&:nth-child(odd)': {
			background: Green[100]+'!important',
		}
	},
	tableRowExgratia: {
		background: Indigo[50]+'!important',
		'&:nth-child(odd)': {
			background: Indigo[100]+'!important',
		}
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
	textCenter: {
		textAlign: 'center',
	},
	instalment: {
		fontWeight: 500,
	}
});

const columnData = [
	{ id: 'createdAt', hidden: 'sm', center: true, numeric: false, disablePadding: true, label: 'تاریخ' },
	{ id: 'name', numeric: false, disablePadding: true, label: 'نام و نام خانوادگی' },
	{ id: 'value', hidden: 'xs', numeric: true, disablePadding: false, label: 'مبلغ' },
	{ id: 'debt', numeric: true, disablePadding: true, label: 'بدهی' },
	{ id: 'instalment', hidden: 'sm', numeric: true, disablePadding: false, label: 'اقساط' },
	{ id: 'action', numeric: false, disablePadding: false, label: '' },
];

class Loans extends React.Component{
	state = {
		loans: null,
		page: 1,
		rowsPerPage: 15,
	};

	handleError = err => this.setState({ error: err.message });

	getLoans = (bankUsername, page=1) => {
		this.setState({ loading: true });
		const key = 'loans';
		let url = `/transactions/${bankUsername}/${key}`;
		url += `?page=${page}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				const isLastPage = result.data.loans.length < this.state.rowsPerPage;
				const loans = this.state.loans ? this.state.loans.concat(result.data.loans) : result.data.loans;
				this.setState({
					loans,
					loading: false,
					isLastPage,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleShowTransactions = loan => e => {
		const bankUsername = this.props.match.params.bankUsername;
		let selectedUsers = {[loan.user_id]: {fn: loan.full_name}};
		this.props.setSelectedUsers(selectedUsers);
		this.props.history.push(`/@${bankUsername}/transaction/instalment/`);
	};

	handleScroll = () => {
		const bankUsername = this.props.match.params.bankUsername;
		const page = this.state.page+1;
		this.getLoans(bankUsername, page);
		this.setState({ page });
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentDidMount = () => {
		const bankUsername = this.props.match.params.bankUsername;
		this.getLoans(bankUsername);
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
			loans,
			loading,
			isLastPage,
		} = this.state;
		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}`;

		return(
			<ErrorBoundary error={error} reload={() => this.getLoans(bankUsername)}>
				{loans
					? <Paper>
							<Title label='وام‌ها' back={`${base}/`} help='/tutorial/' padding />
							<EmptyList data={loans}>
								<Table>
									<TableHead>
										<TableRow>
											{columnData.map(column => {
												let className = [];
												className.push(column.center ? classes.textCenter : null);
												switch(column.hidden){
													case 'xs':
														className.push(classes.hiddenXs);
														break;
													case 'sm':
														className.push(classes.hiddenSm);
														break;
													case 'md':
														className.push(classes.hiddenMd);
														break;
													case 'lg':
														className.push(classes.hiddenLg);
														break;
													case 'xl':
														className.push(classes.hiddenXl);
														break;
													default:
														break;
												}
												return(
													<TableCell
														key={column.id}
														className={classNames(className)}
														numeric={column.numeric}
														padding={column.disablePadding ? 'checkbox' : 'default'}
													>
														{!column.noLabel &&
																column.label
														}
													</TableCell>
												);
											})}
										</TableRow>
									</TableHead>

									<TableBody>
										{loans.map(loan => {
											const shamsi = utils.Miladi2ShamsiObject(loan.created_at_bank);
											const month = utils.persian.month(shamsi.month);
											let debt = 0;
											if(!loan.options.exgratia){
												const lc = new Loan({
													price: loan.value,
													duration: loan.options.duration,
													commission: loan.options.commission,
													profit: loan.options.profit,
													delayed: loan.options.delayed ? loan.options.delayed : 0,
													penalty: loan.options.dailyPenalty ? loan.options.dailyPenalty : 0,
													paidCommission: loan.options.c_ba ? loan.options.c_ba : 0,
													paidPenalty: loan.options.p_ba ? loan.options.p_ba : 0,
													paidInstalment: loan.options.i_ba ? loan.options.i_ba : 0,
													// loanBalance: loan.loan_balance ? loan.loan_balance : 0,
													createdInMonth: loan.options.created_at_in_month,
												});
												debt = lc.getDebt();
											}
											debt = debt > 0 ? debt : 0;
											const duration = loan.options.duration || 0;
											const delayed = loan.options.delayed || 0;
											const instalmentCount = loan.options.i_co || 0
											const isExgratia = loan.options.exgratia && loan.options.exgratia > 0;
											const isFullyPaid = loan.options.fully_paid && loan.options.fully_paid > 0;
											let className = '';
											if(delayed > 0)
												className = classes.tableRowDelayed;
											else if(isExgratia)
												className = classes.tableRowExgratia;
											else if(isFullyPaid)
												className = classes.tableRowFullyPaid;

											return (
												<TableRow
													className={classNames(classes.tableRow, className)}
													hover
													role="link"
													tabIndex={-1}
													key={loan.id}>
													<TableCell padding="checkbox" className={classNames(classes.cellDate, classes.hiddenSm)}>
														<Typography className={classes.date}>
															{month}
														</Typography>
														<Typography>
															{shamsi.year} / {shamsi.day} 
														</Typography>
													</TableCell>
													<TableCell padding="checkbox">
														<Typography>
															{loan.full_name}
														</Typography>
													</TableCell>
													<TableCell className={classNames(classes.cellPrice, classes.hiddenXs)} numeric>
														<Typography component='span' className={classes.price}>
															{utils.money(-loan.value)}
														</Typography>
														تومان
													</TableCell>
													{isExgratia
														? <TableCell padding='checkbox' className={classes.cellPrice} numeric>
																<Typography component='span' className={classes.price}>
																	بلاعوض
																</Typography>
															</TableCell>
														: <TableCell padding='checkbox' className={classNames(debt === 0 ? classes.cellDraw : classes.cellDebt)} numeric>
																<Typography component='span' className={classes.price}>
																	{utils.money(debt)}
																</Typography>
																تومان
															</TableCell>
													}
													<TableCell className={classNames(classes.instalment, classes.hiddenSm)} padding='default'>
														{duration} / {instalmentCount}
													</TableCell>
													<TableCell padding='none'>
														{!isFullyPaid &&
															<BadgeEnhancement color='secondary' badgeContent={delayed} timeout={600} timeDelay={100}>
																<IconButton onClick={this.handleShowTransactions(loan)} color='inherit'>
																	<SystemUpdateIcon />
																</IconButton>
															</BadgeEnhancement>
														}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
								<InfiniteScroll
									onScroll={this.handleScroll}
									loading={loading}
									isLastPage={isLastPage}
								/>
							</EmptyList>
						</Paper>
					: <Paper>
							<Title label='درحال دریافت اطلاعات...' back={`${base}/`} help='/tutorial/' padding />
							<Table>
								<TableBody>
									{[...Array(10)].map((zeros, i) => {
										return (
											<TableRow
												className={classes.tableRow}
												hover
												role="link"
												tabIndex={-1}
												key={i}>
												<TableCell padding="checkbox">
													<Square height={15} width='100%' />
												</TableCell>

												<TableCell className={classes.cellPrice}>
													<Square height={15} width='100%' />
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</Paper>
				}
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(Loans);
