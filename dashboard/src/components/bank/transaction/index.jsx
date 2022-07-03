import API from 'api';
import React from 'react';
import LoanClass from 'loan';
import propTypes from 'prop-types';
import { Route, Link, Switch } from 'react-router-dom';
import utils from 'utils';
import swal from 'sweetalert';

import Loan from './loan';
import Instalment from './instalment';
import Title from 'components/title';
import Loading from 'components/loading/button';
import DateInput from 'components/dateInput';
import UserAutoSuggest from 'components/bank/userAutoSuggest';

// Elements
import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControlLabel from '@material-ui/core/FormControlLabel';

// Icons

const styles = theme => ({
	root: {
		padding: `${theme.spacing.unit}px ${theme.spacing.unit * 3}px`,
	},
	action: {
		marginTop: theme.spacing.unit*3,
		marginBottom: theme.spacing.unit,
		textAlign: 'left',
		[theme.breakpoints.down('xs')]: {
			textAlign: 'center',
			'& > button': {
				width: '100%',
			}
		}
	},
	inputAdornment: {
		height: 20,
	},
	chip: {
		marginLeft: theme.spacing.unit
	},
	chipRoot: {
		flexDirection: 'row-reverse',
	},
	baseLine: {
		alignSelf: 'baseline',
	},
	loanRadio: {
		flexDirection: 'row',
		marginTop: 18,
		justifyContent: 'space-evenly',
		[theme.breakpoints.down('md')]: {
		}
	},
	paper: {
		padding: '5px 10px',
		borderColor: '#eee',
		borderStyle: 'solid',
		borderWidth: '1px 1px',
	},
	footerContainer: {
		// margin: 8,
		// marginTop: 16,
		// border: '1px solid #bbb',
	},
	paperHeader: {
		display: 'block',
		fontSize: '0.8rem',
		textAlign: 'center',
		color: '#999',
		height: 17
	},
	paperContent: {
		display: 'block',
		fontSize: '1rem',
		textAlign: 'center',
		color: '#111',
		padding: '10px',
		overflow: 'hidden',
	},
	paperFooter: {
		display: 'block',
		fontSize: '0.6rem',
		textAlign: 'left',
		color: '#999',
	},
	contentText: {
		marginBottom: 20,
		opacity: 0.7,
		textAlign: 'justify',
	},
	percentage: {
		// width: '100%',
		textAlign: 'left',
	},
	/* container: {
		flexGrow: 1,
		position: 'relative',
		// height: 100,
		// width: 200,
	},
	suggestionsContainerOpen: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 2000,
	},
	suggestion: {
		display: 'block',
	},
	suggestionsList: {
		margin: 0,
		padding: 0,
		maxHeight: 3*48,
		overflowY: 'auto',
		listStyleType: 'none',
	}, */
});


class Transaction extends React.Component{
	state = {
		type: this.props.types.transaction.payment.value,
		fullName: '',
		suggestions: [],
		mode: 'basic',

		price: '',
		date: {
			date: new Date(),
			persian: utils.Miladi2Shamsi(new Date())
		},

		// Loan
		duration: 10,
		profitPercentage: 0,
		commissionPercentage: 4,
		penaltyPercentage: 0,
		exgratia: false,

		// Instalment
		loans: null,
		instalmentType: 'instalment',
		loadingDetails: false,
		selectedLoan: null,

		loadingSubmit: false,
		loadingCreate: false,
		loadingCreateAndPay: false
	};

	handleSubsets = (subsets, uid) => {
		let userSelectedSubsets = subsets[uid];
		if(userSelectedSubsets.hasOwnProperty('all')){
			return {[uid + '-subset']: 'تمامی زیرمجموعه‌های ' + uid};
		} else {
			return userSelectedSubsets;
		}
	};

	getLoans = bankUserId => {
		this.setState({ loadingDetails: true });
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'loan';
		const url = `/transactions/${bankUsername}/${key}?uid=${bankUserId}&status=accepted&fullypaid=-1`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					loans: result.data.transactions,
					loadingDetails: false,
					error: null,
				});
				if(result.data.transactions.length > 0)
					this.handleSelectedLoan({ target: { value: result.data.transactions[0].id }});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	getLoanDetails = loan => {
		let loanDetails = null;
		let instalmentType = 'instalment';
		let price = '';
		let max = null;
		if(loan){
			loanDetails = new LoanClass({
				price: loan.transaction.value,
				duration: loan.options.duration,
				commission: loan.options.commission,
				profit: loan.options.profit,
				delayed: loan.options.delayed ? loan.options.delayed : 0,
				penalty: loan.options.dailyPenalty ? loan.options.dailyPenalty : 0,
				paidPenalty: loan.options.p_ba ? loan.options.p_ba : 0,
				paidCommission: loan.options.c_ba ? loan.options.c_ba : 0,
				paidInstalment: loan.options.i_ba ? loan.options.i_ba : 0,
				createdInMonth: loan.options.created_at_in_month,
			});
			if(loanDetails.getUnpaidPenalty() > 0)
				instalmentType = 'penalty';
			else if(loanDetails.getUnpaidCommission() > 0)
				instalmentType = 'commission';
			price = this.getInstalmentTypePrice(instalmentType, loan, loanDetails);
			max = this.getMax(instalmentType, loan, loanDetails);
		}
		this.setState({ loanDetails, price, max, instalmentType });
	};

	updateLoanDetails = (loan, type, price) => {
		const i_ba = loan.options.i_ba || 0;
		const c_ba = loan.options.c_ba ? parseFloat(loan.options.c_ba) : 0;
		const p_ba = loan.options.p_ba || 0;
		const l_ba = loan.options.l_ba || 0;
		if(type === 'instalment') {
			loan.options.i_ba = utils.addFloat(i_ba, price);
			loan.transaction.child_value = price;
			let d = new Date();
			loan.transaction.child_create_at = d.toJSON();
		}
		else if(type === 'penalty')
			loan.options.p_ba = utils.addFloat(p_ba, price);
		else if(type === 'commission') {
			loan.options.c_ba = utils.addFloat(c_ba, price);
		}
		loan.options.l_ba = utils.addFloat(l_ba, price);
		loan.options.i_co = Math.floor(loan.options.i_ba / loan.options.instalment);
		loan.options.delayed = loan.options.created_at_in_month - loan.options.i_co;
		if(loan.options.l_ba >= utils.addFloat(loan.options.reim, loan.options.dailyPenalty))
			loan.options.fully_paid = 1;
		this.getLoanDetails(loan);
		// return loan;
	};


	handleChange = (name, isNumber) => e => {
		let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
		if(isNumber)
			val = val && val > 0 ? val : 0;
		this.setState({ [name]: val });
	};

	handleChangeType = e => {
		let val = e.target.value;
		this.setState({ type: val, max: null, price: '' });
	};

	handleChangeMode = e => {
		if(e.target.value === 'basic'){
			this.setState({
				mode: e.target.value,
				profitPercentage: 0,
				penaltyPercentage: 0,
				exgratia: false,
			});
		} else {
			this.setState({
				mode: e.target.value,
			});
		}
	};

	handleChangeInstalmentType = e => {
		const instalmentType = e.target.value;
		const price = this.getInstalmentTypePrice(instalmentType);
		const max = this.getMax(instalmentType);
		this.setState({ instalmentType, price, max });
	};

	getInstalmentTypePrice = (instalmentType, loan=null, loanDetails=null) => {
		if(!loan)
			loan = this.state.selectedLoan;
		if(!loanDetails)
			loanDetails = this.state.loanDetails;

		let price = '';
		if(loan.options && loanDetails) {
			switch(instalmentType){
				case 'commission':
					price = loanDetails.getUnpaidCommission();
					break;
				case 'penalty':
					price = loanDetails.getUnpaidPenalty();
					break;
				case 'instalment':
					price = loanDetails.getUnpaidInstalment();
					break;
				default:
					price = '';
			}
		}
		return price <= 0 ? '' : price;
	}

	handleChangeDuration = e => {
		let val = e.target.value;
		val = val && val > 2 ? val : 2;
		this.setState({ duration: val });
	};

	handleSelectedLoan = e => {
		this.setState({
			loadingDetails: true,
		});
		const transactionId = e.target.value;
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'loan';
		const url = `/transactions/${bankUsername}/${key}/${transactionId}?child=1`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				let loan = result.data;
				this.getLoanDetails(loan);
				this.setState({
					loadingDetails: false,
					selectedLoan: loan,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleMoney = e => {
		let price = utils.sanitize.money(e.target.value);

		// Set maximum value for instalment/penalty/commission
		if(this.state.type === 'instalment'){
			// max = this.getMax(this.state.instalmentType);
			const max = this.state.max;
			price = price >= max ? max : price;
		}
		this.setState({ price: (parseInt(price*10)/10) });
	};

	handleDate = (date, persian) => {
		this.setState({
			date: {
				date: date,
				persian: persian
			}
		});
	};

	getMax = (instalmentType, loan=null, loanDetails=null) => {
		loan = loan || this.state.selectedLoan;
		loanDetails = loanDetails || this.state.loanDetails;
		if(instalmentType === 'instalment') {
			const paid = loan.options.i_ba || 0;
			const loanPrice = loan.options.duration * loan.options.instalment*10;
			return (Math.round(loanPrice - (paid*10))) / 10;
		}
		else if(instalmentType === 'commission') {
			return loanDetails.getCommission() - loan.options.c_ba;
		}
		return this.getInstalmentTypePrice(instalmentType, loan, loanDetails) || 0;
	}

	// Form Submit
	handleError = err => {
		this.setState({
			loadingSubmit: false,
			loadingCreate: false,
			loadingCreateAndPay: false,
		});
		swal({
			text: err.message,
			icon: 'error',
			buttons: {
				confirm: {
					text: 'باشه',
					value: true,
				}
			}
		});
	}

	handleLoanError = (oldLoan) => err => {
		this.getLoanDetails(oldLoan);
		this.setState({
			selectedLoan: oldLoan,
		});
		return this.handleError(err);
	};

	handleJSONData = type => {
		const ids = this.getSelectedUsersIds(type);
		const price = utils.sanitize.money(this.state.price);
		if(!ids || (isNaN(parseInt(ids, 10)) && (!ids.all || ids.all.length <= 0) && (!ids.persons || ids.persons.length <= 0)))
			return this.handleError(new Error('کاربری انتخاب نشده است'));
		else if(!price)
			return this.handleError(new Error('مبلغی وارد نشده است'));
		else if(!this.state.type)
			return this.handleError(new Error('نوع تراکنش انتخاب نشده است'));

		const { 
			date,
			description,
			duration,
			profitPercentage,
			commissionPercentage,
			penaltyPercentage,
			instalment,
			exgratia
		} = this.state;

		if(type === 'instalment') {
			return {
				id: ids,
				value: price,
				createdAtBank: date.date.toJSON()
			}
		} else {
			const obj = {
				value: price,
				description,
				duration,
				instalment,
				exgratia,
				commission: commissionPercentage,
				profit: profitPercentage,
				penalty: penaltyPercentage,
				createdAtBank: date.date.toJSON()
			};
			obj.ids = JSON.stringify(ids).toString();
			return obj;
		}
	};

	handleSubmit = e => {
		const jsonData = this.handleJSONData(this.state.type);
		if(!jsonData)
			return false;
		const bankUsername = this.props.match.params.bankUsername;
		const type = this.state.type;
		const temp = JSON.parse(JSON.stringify(this.state.selectedLoan));
		const loan = this.state.selectedLoan;
		const instalmentType = this.state.instalmentType;
		const isInstalment = type === 'instalment';
		if(isInstalment){
			this.updateLoanDetails(loan, instalmentType, parseFloat(jsonData.value));
		}
		const key = 'create';
		const url = isInstalment
			? `/transactions/${bankUsername}/loan/${loan.transaction.id}/${instalmentType}`
			: `/transactions/${bankUsername}/${type}`;
		const cb = {
			error: isInstalment ? this.handleLoanError(temp) : this.handleError,
			succeed: result => {
				this.setState({
					loadingSubmit: false,
					loadingCreate: false,
					loadingCreateAndPay: false
				});
				if(!isInstalment){
					this.props.setSelectedUsers({});
					this.props.history.push(`/@${bankUsername}/`);
				}
				this.props.handleOpenSnack({
					variant: 'success',
					message: 'تراکنش  با موفقیت ایجاد شد',
				});
			}
		};
		if(this.props.role && (this.props.role === 'bankAdmin' || this.props.role === 'Creator'))
			API.Result(cb, this.API.put({ url, key, jsonData }));
		else
			API.Result(cb, this.API.post({ url, key, jsonData }));
	}

	handleCreate = e => {
		this.setState({
			loadingSubmit: true,
			loadingCreate: true,
			loadingCreateAndPay: false
		});
		this.handleSubmit(e);
	};

	handleCreateAndPay = e => {
		this.setState({
			loadingSubmit: true,
			loadingCreate: false,
			loadingCreateAndPay: true
		});
		this.handleSubmit(e);
	};

	getSelectedUsersIds = type => {
		// const selectedUsers = this.props.getUsers();
		const selectedUsers = this.props.getSelectedUsers();
		if(type === 'instalment'){
			let keys = Object.keys(selectedUsers);
			return keys.length > 0 ? keys[0] : 0;
		} else {
			let ids = {};
			if(selectedUsers.hasOwnProperty('all')){
				ids['all'] = Object.keys(selectedUsers.all);
				delete selectedUsers.all;
			}
			ids['persons'] = Object.keys(selectedUsers);
			return ids;
		}
	};

	addSelectedUser = user => {
		if(this.state.type === 'instalment'){
			this.setState({ loans: null });
			this.props.clearSelectedUsers();
			this.getLoans(user.user_id);
		}
		this.props.addSelectedUser(user);
	};

	removeSelectedUser = (uid, pid) => e => {
		this.props.removeSelectedUser(uid, pid)(e);
		this.setState({ loans: null });
	};

	componentWillMount = () => {
		this.API = new API();
		this.snackQueue = [];
		this.setState({
			type: this.props.match.params.type,
		});
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			loadingSubmit,
			loadingCreate,
			loadingCreateAndPay,
			type,
			mode
		} = this.state;
		const { classes, types } = this.props;
		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}`;
		const url = `${base}/transaction`;
		const users = this.props.getUsers();
		const isLoan = type === 'loan';
		const isAdvanced = mode === 'advanced';
		const selectedIds = Object.keys(this.props.getUsers()).map(id => parseInt(id, 10));

		return(
			<Paper className={classes.root}>
				<Title label='ایجاد تراکنش' back={`${base}/`} help='/tutorial/' />
				<div>
					<Typography className={classes.contentText}>
						برای اعطای وام، افزایش موجودی، دریافت قسط و ... از طریق فرم زیر اقدام کنید
					</Typography>
					<Typography className={classes.contentText}>
						درصورتی که کاربران را از لیست انتخاب نکرده‌اید، می‌توانید با وارد کردن نام و نام خانوادگی، شماره همراه یا نام کاربری این کار را انجام دهید
					</Typography>

					<Grid container spacing={16}>
						<Grid item xs={12}>
							<Paper elevation={0}>
								{Object.keys(users).map(uid => (
									<Chip
										key={uid}
										label={users[uid].fn}
										onDelete={this.removeSelectedUser(uid, users[uid].p)}
										className={classes.chip}
										classes={{
											root: classes.chipRoot
										}}
									/>
								))}
							</Paper>
						</Grid>

						<Grid item xs={12}>
							<UserAutoSuggest
								onClick={this.addSelectedUser}
								bankUsername={bankUsername}
								exclude={selectedIds}
							/>
						</Grid>

						<Grid item xs={12} sm={isLoan ? 6 : 4} lg={isLoan ? 3 : 4} className={classes.baseLine}>
							<TextField
								fullWidth
								id='price'
								type='text'
								label='مبلغ'
								margin='dense'
								helperText={`قابل پرداخت: ${this.state.max && this.state.max >= 0 ? utils.money(this.state.max) + ' تومان' : 'نامحدود'}`}
								value={utils.money(this.state.price)}
								onChange={this.handleMoney} 
								onKeyPress={e => e.key === 'Enter' && this.handleCreateAndPay(e)}
								InputProps={{
									endAdornment: <InputAdornment style={{marginLeft: 8}} position='end'>تومان</InputAdornment>
								}}
							/>
						</Grid>

						<Grid item xs={12} sm={isLoan ? 6 : 4} lg={isLoan ? 3 : 4} className={classes.baseLine}>
							<DateInput
								fullWidth={true}
								onClick={this.handleDate}
								label='در تاریخ' />
							<input name='createdAtBank' value={this.state.date.date.toJSON()} type='hidden' />
						</Grid>
						<Grid item xs={isLoan ? 5 : 12} sm={isLoan ? 7 : 4} lg={isLoan ? 3 : 4} className={classes.baseLine}>
							<TextField
								select
								fullWidth
								margin="dense"
								label='نوع تراکنش'
								onChange={this.handleChangeType}
								value={this.state.type}>
								{Object.keys(types.transaction).map(key => (
									<MenuItem key={key} value={key} component={Link} to={`${url}/${key.toLowerCase()}/`}>{types.transaction[key].value}</MenuItem>
								))}
							</TextField>
						</Grid>

						{isLoan &&
							<Grid item xs={7} sm={5} lg={3} className={classes.baseLine}>
								<RadioGroup
									className={classes.loanRadio}
									onChange={this.handleChangeMode}
									value={mode}
									>
									<FormControlLabel
										value='basic'
										label='ساده'
										control={<Radio />}
									/>
									<FormControlLabel
										value='advanced'
										label='پیشرفته'
										control={<Radio />}
									/>
								</RadioGroup>
							</Grid>
						}

						<Grid item xs={12}>
							<TextField
								margin="normal"
								fullWidth
								label='توضیحات'
								onChange={this.handleChange('description')}
								value={this.state.description}/>
						</Grid>

						<Switch>
							<Route exact path={`${url}/loan/`} render={(props) => (
								<Loan
									isAdvanced={isAdvanced}
									price={utils.sanitize.number(this.state.price)} 
									commissionPercentage={this.state.commissionPercentage}
									profitPercentage={this.state.profitPercentage}
									penaltyPercentage={this.state.penaltyPercentage}
									duration={this.state.duration}
									exgratia={this.state.exgratia}
									handleChange={this.handleChange}
									handleChangeDuration={this.handleChangeDuration}
									{...props}
									/>
							)} />

							<Route exact path={`${url}/instalment/`} render={(props) => (
								<Instalment
									setSelectedUsers={this.props.setSelectedUsers}
									addSelectedUser={this.props.addSelectedUser}
									clearSelectedUsers={this.props.clearSelectedUsers}
									getUsers={this.props.getUsers}
									loans={this.state.loans} 
									types={types}
									instalmentType={this.state.instalmentType}
									selectedLoan={this.state.selectedLoan}
									handleChange={this.handleChange}
									handleChangeInstalmentType={this.handleChangeInstalmentType}
									loanDetails={this.state.loanDetails}
									handleSelectedLoan={this.handleSelectedLoan}
									getLoans={this.getLoans}
									loadingDetails={this.state.loadingDetails}
									loading={loadingSubmit}
									{...props}
									/>
							)} />
						</Switch>
					</Grid>
				</div>

				<div className={classes.action}>
					<Button
						disabled={loadingSubmit}
						onClick={this.handleCreate}>
						ایجاد
						<Loading show={loadingSubmit && loadingCreate} />
					</Button>
					<Button
						color='primary'
						disabled={loadingSubmit}
						onClick={this.handleCreateAndPay}>
						ایجاد و افزودن به لیست پرداخت
						<Loading show={loadingSubmit && loadingCreateAndPay} />
					</Button>
				</div>
			</Paper>
		);
	}
}

Transaction.propTypes = {
	types : propTypes.object.isRequired,
};
export default withStyles(styles)(Transaction);
