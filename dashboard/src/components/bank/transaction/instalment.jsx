import API from 'api';
import React from 'react';
import classNames from 'classnames';
import propTypes from 'prop-types';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import Loading from 'components/loading/button';
import EmptyList from 'components/emptyList';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit,
		[theme.breakpoints.down('xs')]:{
			padding: 0
		}
	},
	loading: {
		margin: '20px auto',
	},
	row: {
		padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		'&:nth-child(4n-3), &:nth-child(4n)': {
			background: '#eee',
			borderRadius: 50
		},
		[theme.breakpoints.down('xs')]:{
			padding: theme.spacing.unit,
			'&:nth-child(4n-3), &:nth-child(4n)': {
				background: '#fff',
				borderRadius: 0
			},
			'&:nth-child(2n-1)': {
				background: '#eee',
				borderRadius: 50
			},
		}
	},
	instalmentType: {
		marginTop: 10,
		flexDirection: 'row',
	},
	key: {
		float: 'right',
	},
	value: {
		fontWeight: 600,
		float: 'left',
	},
	label: {
		fontWeight: 200,
		fontSize: '0.7rem',
		marginRight: theme.spacing.unit
	},
	date: {
		direction: 'ltr',
	},
	selectUserText: {
		textAlign: 'center',
		color: 'gray',
		fontSize: '1.1rem',
		fontWeight: 200,
	},
});

class Instalment extends React.Component{
	state = {
		status: {
			delayed: {
				value: 'به تعویق افتاده',
				color: '#c51818',
			},
			complete: {
				value: 'تسویه شده',
				color: '#228ce6',
			},
			ontime: {
				value: 'پرداخت به موقع',
				color: '#1e9010',
			},
			indebt: {
				value: 'بدهکار',
				color: '#c51818',
			},
		},
	};

	getLoans = () => {
		// const selectedUsers = this.props.getSelectedUsers();
		const selectedUsers = this.props.getUsers();
		const ids = Object.keys(selectedUsers);
		if(ids.length > 0){
			const id = ids[0];
			// Reduce selectedUsers to 1
			if(ids.length > 1){
				const user = {
					id,
					full_name: selectedUsers[id].fn
				};
				this.props.clearSelectedUsers();
				this.props.addSelectedUser(user);
			}
			this.props.getLoans(id);
		}
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentDidMount = () => {
		this.getLoans();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
			types,
			loans,
			instalmentType,
			selectedLoan,
			loadingDetails,
			loading,
			handleSelectedLoan,
			handleChangeInstalmentType,
		} = this.props;

		const loan = selectedLoan;
		const showLoanDetails = () => {
			const lc = this.props.loanDetails;
			const debt = lc.getDebt();
			let status = '';
			if(loan.options.delayed && loan.options.delayed > 0)
				status = 'delayed';
			else if (debt > 0)
				status = 'indebt';
			else if (loan.options.fully_paid)
				status = 'complete';
			else
				status = 'ontime';

			const loanBalance = loan.options.l_ba || 0;
			const instalment = loan.options.instalment;
			const instalmentCount = loan.options.i_co || 0;
			const commissionBalance = loan.options.c_ba || 0;
			const unpaidCommission = lc.getUnpaidCommission();
			const penalty = loan.options.dailyPenalty || 0;
			const penaltyBalance = loan.options.p_ba || 0;
			const unpaidPenalty = penalty - penaltyBalance;
			const childTransactionValue = loan.transaction.child_value || 0;
			const childTransactionDate = loan.transaction.child_created_at_bank ? utils.Miladi2Shamsi(loan.transaction.child_created_at_bank, 'jYYYY/jMM/jDD') : 'وجود ندارد';
			return (
				<Grid container style={{marginTop: 16}}>
					<Grid className={classes.row} item xs={12} md={12}>
						<Typography className={classes.key}>وضعیت:</Typography>
						<Typography className={classes.value} style={{color: this.state.status[status].color}}>
							{this.state.status[status].value}
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>تعداد اقساط وصول شده:</Typography>
						<Typography className={classes.value}>
							{instalmentCount}
							<span className={classes.label}>عدد</span>
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>مبلغ هر قسط:</Typography>
						<Typography className={classes.value}>
							{utils.money(instalment)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>مبلغ وصولی تاکنون:</Typography>
						<Typography className={classes.value}>
							{utils.money(loanBalance)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>مانده بدهی تا امروز:</Typography>
						<Typography className={classes.value}>
							{debt <= 0 ? 0 : utils.money(debt)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>دیرکرد پرداخت شده:</Typography>
						<Typography className={classes.value}>
							{utils.money(penaltyBalance)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>دیرکرد:</Typography>
						<Typography className={classes.value}>
							{utils.money(unpaidPenalty)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>کارمزد پرداخت شده:</Typography>
						<Typography className={classes.value}>
							{utils.money(commissionBalance)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>کارمزد:</Typography>
						<Typography className={classes.value}>
							{utils.money(unpaidCommission)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>مبلغ آخرین قسط پرداختی:</Typography>
						<Typography className={classes.value}>
							{utils.money(childTransactionValue)}
							<span className={classes.label}>تومان</span>
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>تاریخ آخرین قسط پرداختی: </Typography>
						<Typography className={classes.value}>
							{childTransactionDate}
						</Typography>
					</Grid>

					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>تاریخ اعطای وام:</Typography>
						<Typography className={classNames(classes.value, classes.date)}>
							{utils.Miladi2Shamsi(loan.transaction.created_at_bank, 'jYYYY/jMM/jDD')}
						</Typography>
					</Grid>
					<Grid className={classes.row} item xs={12} sm={6}>
						<Typography className={classes.key}>سررسید آخرین قسط:</Typography>
						<Typography className={classNames(classes.value, classes.date)}>
							{utils.Miladi2Shamsi(loan.transaction.created_at_bank, 'jYYYY/jMM/jDD', {month: loan.options.duration})}
						</Typography>
					</Grid>
				</Grid>
			);
		};

		return(
			<Grid item xs={12}>
					{loans 
						? loans.length > 0
							? <Grid container className={classes.root}>
									<Grid item xs={12} sm={6} md={8}>
										<TextField
											select
											fullWidth
											label='لیست وام‌ها'
											disabled={loading}
											onChange={handleSelectedLoan}
											value={loan && loan.hasOwnProperty('transaction') ? loan.transaction.id : 0}>
											{loans.map(l => (
												<MenuItem key={l.id} value={l.id}>
													{utils.money(-l.value)} به صورت {l.duration} ماهه
												</MenuItem>
											))}
										</TextField>
									</Grid>

									<Grid item xs={12} sm={6} md={4}>
										<RadioGroup
											className={classes.instalmentType}
											onChange={handleChangeInstalmentType}
											value={instalmentType}>
											{Object.keys(types.instalment).map(key => (
												<FormControlLabel
													key={key}
													value={key}
													label={types.instalment[key].value}
													control={<Radio />}
												/>
											))}
										</RadioGroup>
									</Grid>

									<Grid item xs={12}>
										{loadingDetails
											? <Loading className={classes.loading} center show color='#aaa' width={48} height={48} />
											: <EmptyList noShadow data={loan} content='یکی از وام‌ها را انتخاب کنید'>
													{loan && loan.options
														? showLoanDetails()
														: <div/>
													}
												</EmptyList>
										}
									</Grid>
								</Grid>
							: <EmptyList noShadow data={loans} content='کاربر هیچ وامی ندارد'/>
						: loadingDetails
							? <Loading className={classes.loading} center show color='#aaa' width={48} height={48} />
							: <EmptyList noShadow data={loans} content='ابتدا یک کاربر را انتخاب کنید'/>
					}
			</Grid>
		);
	}

}

Instalment.propTypes = {
	loans											 : propTypes.array.isRequired,
	selectedLoan							 : propTypes.object.isRequired,
	handleChange							 : propTypes.func.isRequired,
	handleChangeInstalmentType : propTypes.func.isRequired,
	getLoans									 : propTypes.func.isRequired,
}
export default withStyles(styles)(Instalment);
