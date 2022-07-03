import API from 'api';
import React from 'react';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import swal from 'sweetalert';

// Elements
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import Title from 'components/title';
import Pagination from 'components/pagination';
import ErrorBoundary from 'components/errorBoundary';
import FormValidation from 'components/formvalidation';

import Green from '@material-ui/core/colors/green';
import Red from '@material-ui/core/colors/red';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit * 3,
	},
	searchForm: {
		marginBottom: theme.spacing.unit * 4,
		padding: theme.spacing.unit * 2,
		borderRadius: 5,
		border:  '1px solid #ddd',
	},
	banks: {
		borderRadius: 5,
		border:  '1px solid #ddd',
	},
	row: {
		padding: theme.spacing.unit * 2,
		borderBottom:  '1px solid #ddd',
		alignItems: 'center',
		'&:last-child': {
			borderBottom: 'none',
		}
	},
	modal: {
		position: 'absolute',
		height: 400,
		width: theme.spacing.unit * 50,
		backgroundColor: theme.palette.background.paper,
		boxShadow: theme.shadows[5],
		padding: theme.spacing.unit * 4,
		top: 'calc(50% - 250px)',
		right: `calc(50% - ${theme.spacing.unit*25}px)`,
		overflow: 'auto',
	},
	textLeft: {
		fontFamily: theme.fonts.en,
		textAlign: 'left',
		direction: 'ltr',
	},
	accept: {
		color: Green.A700,
	},
	decline: {
		color: Red.A400,
	},
});

class AdminBanks extends React.Component{
	state = {
		error: null,
		banks: [],
		selectedBank: null,
		isDetailsOpen: false,
		loadingDeleteBank: false,
		searchType: 'id',
		rowsPerPage: 50,
		total: 0,
	}

	handleChange = name => e => {
		let value = e.target.value;
		this.setState({
			[name]: value
		});
	}

	handleError = err => this.setState({ error: err.message });

	handleSearch = e => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const type = encodeURIComponent(formData.get('type'));
		const value = encodeURIComponent(formData.get('value'));
		const key = 'banks';
		const url = `/admin/${key}/?type=${type}&value=${value}`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				banks: result.data.banks,
				total: result.data.total,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	getBanks = () => {
		const key = 'banks';
		const url = `/admin/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				banks: result.data.banks,
				total: result.data.total,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleChangeSelected = name => e => {
		let value = e.target.value;
		let selectedBank = this.state.selectedBank;
		selectedBank[name] = value;
		this.setState({ selectedBank });
	}

	handleUpdateBank = e => {
		const formData = new FormData(e.currentTarget);
		const bank = this.state.selectedBank;
		swal({
			text: `از بروزرسانی اطلاعات "${bank.name}" اطمینان دارید؟`,
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					text: 'نه',
					value: null,
					visible: true
				},
				confirm: {
					text: 'آره',
					value: true,
				},
			}
		}).then(value => {
			if(value){
				const key = 'banks';
				const url = `/admin/${key}/${bank.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						const banks = this.state.banks.map(b => {
							if(b.id === bank.id)
								return bank;
							return b;
						});
						this.setState({ banks });
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.patch({ url, key, formData }));
			}
		});
	}

	handleDeleteBank = e => {
		const bank = this.state.selectedBank;
		swal({
			text: `از حذف بانک "${bank.name} @${bank.username}" اطمینان دارید؟`,
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					text: 'نه',
					value: null,
					visible: true
				},
				confirm: {
					text: 'آره',
					value: true,
				},
			}
		}).then(value => {
			if(value){
				this.setState({ loadingDeleteBank: true });
				const key = 'banks';
				const url = `/admin/${key}/${bank.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						this.handleCloseDetails();
						this.setState({
							loadingDeleteBank: false,
						});
						this.getBanks();
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	handleDeleteAvatar = e => {
		const bank = this.state.selectedBank;
		swal({
			text: `از حذف آواتار "${bank.name}" اطمینان دارید؟`,
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					text: 'نه',
					value: null,
					visible: true
				},
				confirm: {
					text: 'آره',
					value: true,
				},
			}
		}).then(value => {
			if(value){
				const key = 'banks';
				const url = `/admin/${key}/${bank.id}/avatar`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						const bank = this.state.selectedBank;
						const banks = this.state.banks.map(b => {
							if(b.id === bank.id)
								b.avatar = null;
							return b;
						});
						bank.avatar = null;
						this.handleCloseDetails();
						this.setState({
							banks,
							selectedBank: bank,
						});
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	handleShowDetails = bankId => e => {
		const selectedBank = JSON.parse(JSON.stringify(this.state.banks.filter(bank => bank.id === bankId)[0]));
		this.setState({
			isDetailsOpen: true,
			selectedBank,
		});
	}

	handleCloseDetails = () => {
		this.setState({
			selectedBank: null,
			isDetailsOpen: false,
		});
	}

	componentDidMount = () => {
		this.API = new API();
		this.getBanks();
	}

	componentWillUnmount = () => {
		this.API.cancel();
	}

	render(){
		const {
			error,
			banks,
			selectedBank,
			isDetailsOpen,
			loadingDeleteBank,
			total,
			rowsPerPage,
		} = this.state;

		const {
			classes,
		} = this.props;

		const base = '/admin/banks';
		const currentPage = this.props.match.params.currentPage;
		return(
			<ErrorBoundary error={error} reload={this.getBanks}>
				<Paper className={classes.root}>
					<header>
						<Title
							label="مدیریت بانک‌ها"
							currentPage={currentPage}
						/>
						<form className={classes.searchForm} onSubmit={this.handleSearch}>
							<Grid container spacing={16}>
								<Grid item md={5}>
									<TextField
										label='جستجوی...'
										name='value'
										margin='dense'
										fullWidth
									/>
								</Grid>
								<Grid item md={5}>
									<TextField
										label='نوع جستجو'
										name='type'
										margin='dense'
										fullWidth
										select
										onChange={this.handleChange('searchType')}
										value={this.state.searchType}>
										<MenuItem value="id">شماره کاربری</MenuItem>
										<MenuItem value="name">عنوان</MenuItem>
										<MenuItem value="username">نام کاربری</MenuItem>
										<MenuItem value="plan">طرح</MenuItem>
									</TextField>
								</Grid>
								<Grid item md={2} style={{ alignSelf: 'flex-end' }}>
									<Button
										type="submit"
										fullWidth
									>جستجو</Button>
								</Grid>
							</Grid>
						</form>
					</header>
					<section className={classes.banks}>
						{banks.map(bank => (
							<Grid className={classes.row} container key={bank.id}>
								<Grid item sm={1}>
									<Avatar src={utils.avatar.bank(bank.avatar, bank.username)} />
								</Grid>
								<Grid item sm={2}>
									<Typography>{bank.name}</Typography>
								</Grid>
								<Grid item sm={2}>
									<Typography>{bank.plan}</Typography>
								</Grid>
								<Grid item sm={2}>
									<Typography style={{ direction:'ltr' }} component={Link} to={`/banks/@${bank.username}/`}>
										@{bank.username}
									</Typography>
								</Grid>
								<Grid item sm={3}>
									<Typography>{bank.description}</Typography>
								</Grid>
								<Grid item sm={1}>
									<Typography>{bank.user_count} نفر</Typography>
								</Grid>
								<Grid item sm={1}>
									<Button color="primary" onClick={this.handleShowDetails(bank.id)}>نمایش جزئیات</Button>
								</Grid>
							</Grid>
						))}
						<Pagination
							total={total}
							rowsPerPage={rowsPerPage}
							currentPage={currentPage}
							base={base}
						/>
					</section>
					<Modal
						open={isDetailsOpen}
						onClose={this.handleCloseDetails}>
						{selectedBank && 
							<FormValidation onSubmit={this.handleUpdateBank} className={classes.modal}>
								<Typography>
									شماره بانک:
									{selectedBank.id}
								</Typography>
								<Grid container spacing={16}>
									<Grid item xs={6}>
										<Typography>
											تاریخ ساخت: 
											{utils.Miladi2Shamsi(selectedBank.created_at, 'jYYYY/jMM/jDD')}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography>
											تاریخ ویرایش: 
											{utils.Miladi2Shamsi(selectedBank.updated_at, 'jYYYY/jMM/jDD')}
										</Typography>
									</Grid>
								</Grid>
								<Grid container spacing={8}>
									<Grid item md={4}>
										<TextField
											onChange={this.handleChangeSelected('name')}
											value={selectedBank.name}
											name='name'
											label='عنوان'
											margin='dense'
											fullWidth
											required
										/>
									</Grid>
									<Grid item md={4}>
										<TextField
											onChange={this.handleChangeSelected('username')}
											value={selectedBank.username}
											name='username'
											label='نام کاربری'
											margin='dense'
											fullWidth
											required
										/>
									</Grid>
									<Grid item md={4}>
										<TextField
											onChange={this.handleChangeSelected('avatar')}
											value={selectedBank.avatar}
											name='avatar'
											label='آواتار'
											margin='dense'
											fullWidth
										/>
									</Grid>
								</Grid>
								<TextField
									onChange={this.handleChangeSelected('description')}
									value={selectedBank.description}
									name='description'
									label='توضیحات'
									margin='dense'
									multiline
									rows={3}
									fullWidth
								/>
								<TextField
									onChange={this.handleChangeSelected('role')}
									value={selectedBank.description}
									name='role'
									label='قوانین'
									margin='dense'
									multiline
									rows={3}
									fullWidth
								/>
								<Button
									type='submit'
									color='primary'>
									بروزرسانی
								</Button>
								<Button
									onClick={this.handleDeleteAvatar}
									color='secondary'>
									حذف آواتار
								</Button>
								<Button
									color="secondary"
									disabled={loadingDeleteBank}
									onClick={this.handleDeleteBank}>
									حذف بانک
								</Button>
							</FormValidation>
						}
					</Modal>
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(AdminBanks);

