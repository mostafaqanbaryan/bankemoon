import React, { Component } from 'react';
import LoanClass from 'loan';
import propTypes from 'prop-types';
import utils from 'utils';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputAdornment from '@material-ui/core/InputAdornment';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit,
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
	footerItem: {
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
	dialogTitle:{
		paddingBottom: 0
	},
	dialogContentText: {
		marginBottom: 20,
	},
	input:{
		height: '1.1875em',
	},
	percentage: {
		// width: '100%',
		textAlign: 'left',
	},
	percentageInput:{
		direction: 'ltr',
	},
	container: {
		flexGrow: 1,
		position: 'relative',
		// height: 100,
		// width: 200,
	},
	suggestionsContainerOpen: {
		position: 'absolute',
		// marginTop: theme.spacing.unit,
		// marginBottom: theme.spacing.unit * 3,
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
		height: 100,
		overflowY: 'auto',
		listStyleType: 'none',
	},
});

class Loan extends Component{
	handleFocus = e => {
		e.target.select();
	}

	render(){
		const {
			classes,
			isAdvanced,
			price,
			commissionPercentage,
			profitPercentage,
			penaltyPercentage,
			duration,
			exgratia,
			handleChange,
			handleChangeDuration,
		} = this.props;

		const loan = new LoanClass({
			price,
			duration,
			commission: commissionPercentage,
			profit: profitPercentage,
			penalty: penaltyPercentage,
		});
		const commissions = loan.getCommissions();
		const commission = loan.getCommission();
		const instalment = loan.getInstalment();
		const reimbursement = loan.getReimbursement();
		const profit = loan.getProfit();

		const col = 4; 
		let len = commissions.length;
		let remainder = len % col; 
		const isExgratia = isAdvanced && exgratia;

		return(
			<Grid container className={classes.root} spacing={16}>
				<Grid item xs={12} sm={6} md={isAdvanced ? 3 : 6} lg={isAdvanced ? 4 : 6}>
					<TextField
						className={classes.percentage}
						name='duration'
						type='number'
						label='تعداد اقساط'
						disabled={isExgratia}
						value={duration}
						onFocus={this.handleFocus}
						onChange={handleChangeDuration}
						fullWidth
						inputProps={{
							min: '2',
						}}
						InputProps={{
							endAdornment: <InputAdornment position='end'>ماه</InputAdornment>
						}}
					/>
				</Grid>

				<Grid item xs={12} sm={6} md={isAdvanced ? 3 : 6} lg={isAdvanced ? 2 : 6}>
					<TextField
						className={classes.percentage}
						label='کارمزد'
						name='commission'
						type='number'
						disabled={isExgratia}
						fullWidth
						value={commissionPercentage}
						onFocus={this.handleFocus}
						onChange={handleChange('commissionPercentage', true)}
						inputProps={{
							step: '0.1',
							min: '0',
							className: classNames(classes.percentageInput, classes.input)
						}}
						InputProps={{
							startAdornment: <InputAdornment position='end'>%</InputAdornment>
						}}
					/>
				</Grid>

				{isAdvanced &&
					<Grid item xs={12} sm={6} md={3} lg={2}>
						<TextField
							className={classes.percentage}
							label='سود بانکی'
							name='percentage'
							type='number'
							disabled={isExgratia}
							fullWidth
							value={profitPercentage}
							onFocus={this.handleFocus}
							onChange={handleChange('profitPercentage', true)}
							inputProps={{
								step: '0.1',
								min: '0',
								className: classNames(classes.percentageInput, classes.input)
							}}
							InputProps={{
								startAdornment: <InputAdornment position='end'>%</InputAdornment>
							}}
						/>
					</Grid>
				}

				{isAdvanced &&
					<Grid item xs={12} sm={6} md={3} lg={2}>
						<TextField
							className={classes.percentage}
							label='دیرکرد'
							name='penalty'
							type='number'
							fullWidth
							disabled={isExgratia}
							value={penaltyPercentage}
							onFocus={this.handleFocus}
							onChange={handleChange('penaltyPercentage', true)}
							inputProps={{
								step: '0.1',
								min: '0',
								className: classNames(classes.percentageInput, classes.input)
							}}
							InputProps={{
								startAdornment: <InputAdornment position='end'>%</InputAdornment>
							}}
						/>
					</Grid>
				}

				{isAdvanced &&
					<Grid item xs={12} sm={6} md={3} lg={2}>
						<FormControlLabel
							label='بلاعوض'
							control={
								<Checkbox checked={exgratia} onChange={handleChange('exgratia')} />
							}
						/>
					</Grid>
				}

				{!isExgratia &&
					<React.Fragment>
						<Grid item container spacing={8} className={classes.footerContainer}>
							<Grid className={classes.footerItem} item xs={12} sm={6} md={isAdvanced ? 3 : 4}>
								<Paper className={classes.paper} elevation={0}>
									<Typography className={classes.paperHeader}>
										مبلغ اقساط ماهیانه
									</Typography>

									<Typography className={classes.paperContent}>
										{utils.money(instalment)}
									</Typography>

									<Typography className={classes.paperFooter}>
										تومان
									</Typography>
								</Paper>
							</Grid>

							<Grid className={classes.footerItem} item xs={12} sm={6} md={isAdvanced ? 3 : 4}>
								<Paper className={classes.paper} elevation={0}>
									<Typography className={classes.paperHeader}>
										مبلغ بازپرداخت
									</Typography>

									<Typography className={classes.paperContent}>
										{utils.money(reimbursement)}
									</Typography>

									<Typography className={classes.paperFooter}>
										تومان
									</Typography>
								</Paper>
							</Grid>

							<Grid className={classes.footerItem} item xs={12} md={isAdvanced ? 3 : 4}>
								<Paper className={classes.paper} elevation={0}>
									<Typography className={classes.paperHeader}>
										کل کارمزد پرداختی
									</Typography>

									<Typography className={classes.paperContent}>
										{utils.money(commission)}
									</Typography>

									<Typography className={classes.paperFooter}>
										تومان
									</Typography>
								</Paper>
							</Grid>

							{isAdvanced &&
								<Grid className={classes.footerItem} item xs={12} sm={6} md={3}>
									<Paper className={classes.paper} elevation={0}>
										<Typography className={classes.paperHeader}>
											کل سود بانکی
										</Typography>

										<Typography className={classes.paperContent}>
											{utils.money(profit)}
										</Typography>

										<Typography className={classes.paperFooter}>
											تومان
										</Typography>
									</Paper>
								</Grid>
							}
						</Grid>

						<Grid item container spacing={8} className={classes.footerContainer}>
							{commissions.map((com, i) => (
								<Grid key={i} className={classes.footerItem} item xs={12} sm={utils.equalColumns(2, len%2, len, i)} md={utils.equalColumns(col, remainder, len, i)}>
									<Paper className={classes.paper} elevation={0}>
										<Typography className={classes.paperHeader}>
											کارمزد سال {utils.numberToPersian(i+1)}
										</Typography>

										<Typography className={classes.paperContent}>
											{utils.money(com)}
										</Typography>

										<Typography className={classes.paperFooter}>
											تومان
										</Typography>
									</Paper>
								</Grid>
							))}
						</Grid>
					</React.Fragment>
				}
			</Grid>
		);
	}
}

Loan.propTypes = {
	commissionPercentage : propTypes.number.isRequired,
	profitPercentage		 : propTypes.number.isRequired,
	penaltyPercentage		 : propTypes.number.isRequired,
	duration						 : propTypes.number.isRequired,
	price								 : propTypes.string.isRequired,
	handleChange				 : propTypes.func.isRequired,
}
export default withStyles(styles)(Loan);
