import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import utils from 'utils';
import PieChart from 'react-svg-piechart';

// Elements
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

import Title from 'components/title';
import EmptyList from 'components/emptyList';
import ErrorBoundary from 'components/errorBoundary';

const styles = theme => ({
	card: {
		textAlign: 'center',
		marginBottom: theme.spacing.unit*3
	},
	cardActions: {
		justifyContent: 'center',
	},
	visitors: {
		fontSize: '0.7rem',
	},
	number: {
		fontSize: '1.5rem',
	},
	paper: {
		padding: theme.spacing.unit*2,
		paddingBottom: 0
	},
	rows: {
		paddingTop: theme.spacing.unit,
	},
	row: {
		border: '2px solid #eee',
		alignItems: 'center',
		padding: theme.spacing.unit,
	},
	rowTitle: {
		fontSize: '1.2rem',
	},
	modal: {
		width: 450,
		height: 400,
		margin: '0 auto',
		marginTop: 400/4,
	},
	modalRow: {
		padding: theme.spacing.unit * 2,
		borderBottom: '1px solid #ccc',
	},
	en: {
		fontFamily: theme.fonts.en,
	}
});

class AdminDashboard extends React.Component{
	state = {
		error: null,
		selectedTransaction: null,
		isModalOpen: false,
		transactions: [],
		visits: {
			v_today: 0,
			v_yesterday: 0,
			v_last_week: 0,
			v_total: 0,
		},
		visitors: {
			today: 0,
			yesterday: 0,
			last_week: 0,
			total: 0,
		},
	};

	handleError = err => this.setState({ error: err.message });
	getDashboard = () => {
		const key = 'snapshot';
		let url = `/admin/${key}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({
					transactions: result.data.transactions,
					visits: result.data.visits,
					visitors: result.data.visitors,
					devices: result.data.devices,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handlePaid = transactionId => e => {
		let transactions = this.state.transactions.filter(t => t.id !== transactionId);
		this.setState({
			transactions,
			selectedTransaction: null,
			isModalOpen: false,
		});
	};

	handleOpenModal = transactionId => e => {
		const selectedTransaction = this.state.transactions.filter(t => t.id === transactionId)[0];
		this.setState({
			isModalOpen: true,
			selectedTransaction,
		});
	};

	handleCloseModal = () => {
		this.setState({
			isModalOpen: false,
			selectedTransaction: null,
		});
	};

	randomColor = () => {
		let color = '#';
		[1,2,3,4,5,6].forEach(() => {
			color += Math.ceil(Math.random()*14).toString(16);
		});
		return color;
	};

	getChartData = data => {
		const total = data.reduce((counter, row) => {
			counter += row.count;
			return counter;
		}, 0);
		const res = data.reduce((array, row) => {
			array.push({
				value: row.count * 100 / total,
				title: `دستگاه: ${row.device}\nسیستم‌عامل: ${row.os} ${row.os_ver}\nمرورگر: ${row.browser} ${row.browser_ver}`,
				color: this.randomColor(),
			});
			return array;
		}, []);
		return res;
	};

	componentDidMount = () => {
		this.API = new API();
		this.getDashboard();
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
			visits,
			visitors,
			devices,
			transactions,
			isModalOpen,
			selectedTransaction,
		} = this.state;
		return(
			<ErrorBoundary error={error} reload={this.getDashboard}>
				<div>
					<Paper className={classes.paper}>
						<Title label='داشبورد' />
					</Paper>
					<Grid container spacing={16}>
						<Grid item md={5}>
							<Card className={classes.card}>
								<CardContent>
									<Typography color='textSecondary'>
										بازدید امروز
									</Typography>
									<Typography className={classes.number}>
										{visits.v_today}
									</Typography>
								</CardContent>
								<CardActions className={classes.cardActions}>
									<Typography className={classes.visitors} color='textSecondary'>
										تعداد بازدیدکننده‌ها
									</Typography>
									<Typography className={classes.visitors} color='textSecondary'>
										{visitors.today}
									</Typography>
								</CardActions>
							</Card>
							<Card className={classes.card}>
								<CardContent>
									<Typography color='textSecondary'>
										بازدید دیروز
									</Typography>
									<Typography className={classes.number}>
										{visits.v_yesterday}
									</Typography>
								</CardContent>
								<CardActions className={classes.cardActions}>
									<Typography className={classes.visitors} color='textSecondary'>
										تعداد بازدیدکننده‌ها
									</Typography>
									<Typography className={classes.visitors} color='textSecondary'>
										{visits.vr_yesterday}
									</Typography>
								</CardActions>
							</Card>
							<Card className={classes.card}>
								<CardContent>
									<Typography color='textSecondary'>
										بازدید هفته گذشته
									</Typography>
									<Typography className={classes.number}>
										{visits.v_last_week}
									</Typography>
								</CardContent>
								<CardActions className={classes.cardActions}>
									<Typography className={classes.visitors} color='textSecondary'>
										تعداد بازدیدکننده‌ها
									</Typography>
									<Typography className={classes.visitors} color='textSecondary'>
										{visits.vr_last_week}
									</Typography>
								</CardActions>
							</Card>
							<Card className={classes.card}>
								<CardContent>
									<Typography color='textSecondary'>
										بازدید کل
									</Typography>
									<Typography className={classes.number}>
										{visits.v_total}
									</Typography>
								</CardContent>
								<CardActions className={classes.cardActions}>
									<Typography className={classes.visitors} color='textSecondary'>
										تعداد بازدیدکننده‌ها
									</Typography>
									<Typography className={classes.visitors} color='textSecondary'>
										{visits.vr_total}
									</Typography>
								</CardActions>
							</Card>
						</Grid>
						<Grid item md={7}>
							{devices 
								? <Paper>
										<PieChart
											data={this.getChartData(devices)}
											strokeColor='#000'
											strokeLinejoin="round"
											strokeWidth={1}
											expandOnHover
										/>
									</Paper>
								: <p>درحال ساخت...</p>
							}
						</Grid>
					</Grid>
				</div>


				<Paper style={{ marginTop: 16 }} className={classes.paper}>
					<Typography variant='title'>فاکتورها</Typography>
					<EmptyList noShadow data={transactions}>
						<div className={classes.rows}>
							{transactions.map(transaction => (
								<Grid className={classes.row} container>
									<Grid item xs>
										{transaction.created_at}
									</Grid>
									<Grid item xs>
										<Typography className={classes.rowTitle}>
											{transaction.bank_name}
										</Typography>
									</Grid>
									<Grid item xs>
										{transaction.full_name}
									</Grid>
									<Grid item xs>
										{utils.money(transaction.value)} تومان
									</Grid>
									<Grid item xs>
										<Button
											color='primary'
											onClick={this.handleOpenModal(transaction.id)}
										>جزئیات</Button>
									</Grid>
								</Grid>
							))}
						</div>
					</EmptyList>
				</Paper>

				<Modal
					open={isModalOpen}
					onClose={this.handleCloseModal}>
					{selectedTransaction &&
						<Paper className={classes.modal}>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									تاریخ ایجاد:
								</Grid>
								<Grid item xs>
									<Typography className={classes.modalTypo}>
										{selectedTransaction.createdAt}
									</Typography>
								</Grid>
							</Grid>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									تاریخ ویرایش:
								</Grid>
								<Grid item xs>
									<Typography className={classes.modalTypo}>
								 	 	 {selectedTransaction.updatedAt}
									</Typography>
								</Grid>
							</Grid>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									مبلغ:
								</Grid>
								<Grid item xs>
									<Typography className={classes.modalTypo}>
										{utils.money(selectedTransaction.value)} تومان
									</Typography>
								</Grid>
							</Grid>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									شماره شبا:
								</Grid>
								<Grid item xs>
									<Typography className={classes.en}>
										{selectedTransaction.bank.shaba}
									</Typography>
								</Grid>
							</Grid>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									صاحب حساب:
								</Grid>
								<Grid item xs>
									<Typography className={classes.modalTypo}>
										{selectedTransaction.bank.owner}
									</Typography>
								</Grid>
							</Grid>
							<Grid container className={classes.modalRow}>
								<Grid item xs>
									شماره سفارش:
								</Grid>
								<Grid item xs>
									<Typography className={classes.en}>
										{selectedTransaction.orderId}
									</Typography>
								</Grid>
							</Grid>
							<Button
								fullWidth
								color='secondary'
								onClick={this.handlePaid(selectedTransaction.id)}>
								پرداخت شد
							</Button>
						</Paper>
					}
				</Modal>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(AdminDashboard);
