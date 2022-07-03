import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import swal from 'sweetalert';

import utils from 'utils';
import Title from 'components/title';
import EmptyList from 'components/emptyList';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import ErrorBoundary from 'components/errorBoundary';
import Pagination from 'components/pagination';
import AddButton from 'components/addbutton';
import Square from 'components/square';
import Circle from 'components/circle';

// Icons
import DoneIcon from '@material-ui/icons/Done';
import EmailIcon from '@material-ui/icons/Email';
import WaitingIcon from '@material-ui/icons/HourglassFull';
import DeclinedIcon from '@material-ui/icons/Close';

// Colors
import Green from '@material-ui/core/colors/green';
import Blue from '@material-ui/core/colors/blue';
import Red from '@material-ui/core/colors/red';
import Orange from '@material-ui/core/colors/orange';

const styles = theme => ({
	icon: {
		height: '38px',
		width: '38px',
	},
	enter: {
		background: Green.A700,
		'&:hover, &:focus': {
			background: Green.A400
		},
	},
	request: {
		background: Blue.A200,
		'&:hover, &:focus': {
			background: Blue.A400,
		},
	},
	waiting: {
		background: Orange[700],
		'&:hover, &:focus': {
			background: Orange.A400,
		},
	},
	declined: {
		background: Red[400],
		'&:hover, &:focus': {
			background: Red.A400,
		},
	},
	searchForm: {
		marginBottom: theme.spacing.unit * 2,
		padding: theme.spacing.unit * 2,
	},
	avatar: {
		height: '64px',
		width: '64px',
		boxShadow: '0 1px 3px #999',
	},
	tableSeperator: {
		width: '90%',
		height: 2,
		background: '#ccc',
		borderRadius: '50%',
		margin: '0 auto',
	},
	tableRow: {
		position: 'relative',
		height: '96px',
	},
	relative: {
		position: 'relative'
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

const columnData = [
	{ id: 'avatar', hidden: 'sm', noLabel: true, numeric: false, disablePadding: true, label: '' },
	{ id: 'name', numeric: false, disablePadding: true, label: 'نام بانک' },
	{ id: 'userCount', hidden: 'md', numeric: true, disablePadding: false, label: 'تعداد اعضا' },
	{ id: 'createdAt', hidden: 'xs', numeric: false, disablePadding: false, label: 'تاریخ تاسیس' },
	{ id: 'request', numeric: false, disablePadding: true, label: 'وضعیت' },
];

class Banks extends React.Component{
	state = {
		base: '',
		// order: 'desc',
		// orderBy: 'createdAt',
		searchType: 'name',
		total: 0,
		rowsPerPage: 9,
		banks: null,
		error: null,
	};

	handleError = result => this.setState({ error: result.message });

	handleChange = name => e =>
		this.setState({ [name]: e.target.value });

	handleWaiting = e => {
		swal({
			text: 'در خواست عضویت شما درحال بررسی است',
			icon: 'info',
			buttons: {
				confirm: {
					text: 'باشه',
					value: true,
				}
			}
		});
	};

	handleDeclined = e => {
		swal({
			text: 'درخواست شما برای عضویت رد شده است',
			icon: 'error',
			buttons: {
				confirm: {
					text: 'باشه',
					value: true,
				}
			}
		});
	};

	getBanks = (page=1) => {
		const key = 'banks';
		const url = `/${key}/?page=${page}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({
					banks: result.data.banks,
					total: result.data.total ? parseInt(result.data.total, 10) : 0,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleSearch = e => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const type = encodeURIComponent(formData.get('type'));
		const value = encodeURIComponent(formData.get('value'));
		const key = 'searchBanks';
		const url = `/banks/?type=${type}&value=${value}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					banks: result.data.banks,
					total: result.data.banks.length,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	componentDidMount = () => {
		this.API = new API();
		const page = this.props.match.params.currentPage || 1;
		this.getBanks(page);
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};


	render(){
		const {
			classes
		} = this.props;
		const {
			banks,
			error,
			// order,
			// orderBy,
			total,
			rowsPerPage,
			base
		} = this.state;

		const page = this.props.match.params.currentPage || 1;

		return (
			<ErrorBoundary reload={() => this.getBanks(page)} error={error}>
				<Paper className={classes.searchForm}>
					<form onSubmit={this.handleSearch}>
						<Grid container spacing={16}>
							<Grid item xs={12} md={5}>
								<TextField
									label='جستجوی بانک'
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
									<MenuItem value="name">نام بانک</MenuItem>
									<MenuItem value="username">نام کاربری</MenuItem>
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
					<Title padding label={banks ? 'نمایش بانک‌ها' : 'درحال دریافت اطلاعات...'} help='/tutorial/'
						button={ <AddButton to='/new/' title='بانک جدید' /> } />

					{banks
						? <EmptyList noShadow data={banks}>
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
										{banks.map(n => {
											const shamsi = utils.Miladi2Shamsi(n.created_at, 'jYYYY/jMM/jDD');
											let status = '';
											let icon;
											let rowClick;
											if(n.status > 0){
												rowClick = () => this.props.history.push(`/@${n.username}/`);
												status = 'ورود';
												icon = (<Button className={classNames(classes.icon, classes.enter)} component={Link} to={`/@${n.username}/`} variant='fab'>
																<DoneIcon />
															</Button>);
											}
											else if(n.status === 'Pending'){
												rowClick = this.handleWaiting;
												status = 'درحال بررسی';
												icon = (<Button className={classNames(classes.icon, classes.waiting)} onClick={this.handleWaiting} variant='fab'>
																<WaitingIcon />
															</Button>);
											}
											else if(n.status === 'Declined'){
												rowClick = this.handleDeclined;
												status = 'رد شد';
												icon = (<Button className={classNames(classes.icon, classes.declined)} onClick={this.handleDeclined} variant='fab'>
																<DeclinedIcon />
															</Button>);
											}
											else{
												rowClick = () => this.props.history.push(`/@${n.username}/request/`);
												status = 'ارسال درخواست عضویت';
												icon = (<Button className={classNames(classes.icon, classes.request)} component={Link} to={`/@${n.username}/request/`} variant='fab'>
																<EmailIcon />
															</Button>);
											}

											return (
												<TableRow
													className={classes.tableRow}
													hover
													onClick={e => e.target.tagName.toLowerCase() === 'td' && rowClick(e)}
													role="link"
													tabIndex={-1}
													key={n.id}>
													<TableCell className={classes.hiddenSm} padding="checkbox">
														<Avatar className={classes.avatar} src={utils.avatar.bank(n.avatar, n.username)} alt={`نماد بانک ${n.name}`} />
													</TableCell>
													<TableCell padding="checkbox">{n.name}</TableCell>
													<TableCell className={classes.hiddenMd} numeric>{n.user_count ? n.user_count : 0} نفر</TableCell>
													<TableCell className={classes.hiddenXs} >{shamsi}</TableCell>
													<TableCell padding="checkbox">
														<Tooltip enterDelay={300} title={status}>{icon}</Tooltip>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</EmptyList>
						: <Table>
								<TableBody>
									{[...Array(10)].map((zeros, i) => (
										<TableRow
											className={classes.tableRow}
											hover
											role="link"
											key={i}
											tabIndex={-1}>
											<TableCell className={classNames(classes.hiddenSm, classes.relative)} padding="checkbox">
												<Circle diameter={64} />
											</TableCell>

											<TableCell className={classes.relative} padding="checkbox">
												<Square height={20} width={200} />
											</TableCell>

											<TableCell className={classNames(classes.relative, classes.hiddenMd)} numeric>
												<Square height={20} width='100%' />
											</TableCell>

											<TableCell className={classNames(classes.relative, classes.hiddenXs)}>
												<Square height={20} width='100%' />
											</TableCell>

											<TableCell className={classes.relative} padding="checkbox">
												<Circle diameter={38} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
					}
					<Pagination
						base={base}
						rowsPerPage={rowsPerPage}
						currentPage={page}
						total={total}
						reload={this.getBanks}
					/>
				</Paper>
			</ErrorBoundary>
		);
	}
}
export default withStyles(styles)(Banks);
