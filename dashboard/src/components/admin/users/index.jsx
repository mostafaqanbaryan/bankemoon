import API from 'api';
import React from 'react';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';

// Elements
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';

import Title from 'components/title';
import Pagination from 'components/pagination';
import ErrorBoundary from 'components/errorBoundary';
import FormValidation from 'components/formvalidation';

// Icons
import AcceptIcon from '@material-ui/icons/CheckCircle';
import DeclineIcon from '@material-ui/icons/Cancel';

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
	users: {
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
		height: 445,
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

class AdminUsers extends React.Component{
	state = {
		error: null,
		users: [],
		selectedUser: null,
		isDetailsOpen: false,
		searchType: 'id',
		rowsPerPage: 50,
		total: 0
	}

	handleError = err => this.setState({ error: err.message });

	handleChange = name => e => {
		let value = e.target.value;
		this.setState({
			[name]: value
		});
	}

	handleSearch = e => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const type = encodeURIComponent(formData.get('type'));
		const value = encodeURIComponent(formData.get('value'));
		const key = 'users';
		const url = `/admin/${key}/?type=${type}&value=${value}`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				users: result.data.users,
				total: result.data.total,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	getUsers = () => {
		const key = 'users';
		const url = `/admin/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				users: result.data.users,
				total: result.data.total,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleChangeSelected = name => e => {
		let value = e.target.value;
		let selectedUser = this.state.selectedUser;
		selectedUser[name] = value;
		this.setState({ selectedUser });
	}

	handleUpdateSelected = e => {
		const formData = new FormData(e.currentTarget);
		const selectedUser = this.state.selectedUser;
		formData.set('email_validate', selectedUser.email_validate);
		formData.set('phone_validate', selectedUser.phone_validate);
		swal({
			text: `از بروزرسانی اطلاعات کاربر ${selectedUser.first_name} ${selectedUser.last_name} اطمینان دارید؟`,
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
				const key = 'users';
				const url = `/admin/${key}/${selectedUser.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						const users = this.state.users.map(u => u.id === selectedUser.id ? selectedUser : u);
						this.setState({ users });
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.patch({ url, key, formData }));
			}
		});
	}

	handleToggleVerify = name => e => {
		let selectedUser = this.state.selectedUser;
		selectedUser[name] = !selectedUser[name];
		this.setState({ selectedUser });
	}

	handleShowDetails = userId => e => {
		const selectedUser = JSON.parse(JSON.stringify(this.state.users.filter(user => user.id === userId)[0]));
		this.setState({
			isDetailsOpen: true,
			selectedUser,
		});
	}

	handleCloseDetails = () => {
		this.setState({
			selectedUser: null,
			isDetailsOpen: false,
		});
	}

	handleDeleteUser = e => {
		const selectedUser = this.state.selectedUser;
		swal({
			text: `از حذف ${selectedUser.first_name} ${selectedUser.last_name} اطمینان دارید؟`,
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
				const key = 'users';
				const url = `/admin/${key}/${selectedUser.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						selectedUser.avatar = null;
						const users = this.state.users.map(u => u.id !== selectedUser.id);
						this.setState({ users });
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	handleDeleteAvatar = e => {
		const selectedUser = this.state.selectedUser;
		swal({
			text: `از حذف آواتار ${selectedUser.first_name} ${selectedUser.last_name} اطمینان دارید؟`,
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
				const key = 'users';
				const url = `/admin/${key}/${selectedUser.id}/avatar`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						selectedUser.avatar = null;
						const users = this.state.users.map(u => u.id === selectedUser.id ? selectedUser : u);
						this.setState({ users });
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	componentDidMount = () => {
		this.API = new API();
		this.getUsers();
	}

	componentWillUnmount = () => {
		this.API.cancel();
	}

	render(){
		const {
			error,
			users,
			selectedUser,
			isDetailsOpen,
			total,
			rowsPerPage,
		} = this.state;

		const {
			classes,
		} = this.props;

		const base = '/admin/users';
		const currentPage = this.props.match.params.currentPage;
		return(
			<ErrorBoundary error={error} reload={this.getUsers}>
				<Paper className={classes.root}>
					<header>
						<Title
							label="مدیریت کاربران"
							currentPage={currentPage}
						/>
						<form className={classes.searchForm} onSubmit={this.handleSearch}>
							<Grid container spacing={16}>
								<Grid item xs={5}>
									<TextField
										label='جستجوی...'
										name='value'
										fullWidth
									/>
								</Grid>
								<Grid item xs={5}>
									<TextField
										label='نوع جستجو'
										name='type'
										fullWidth
										className={classes.searchType}
										onChange={this.handleChange('searchType')}
										value={this.state.searchType}
										select>
										<MenuItem value="id">شماره کاربری</MenuItem>
										<MenuItem value="username">نام کاربری</MenuItem>
										<MenuItem value="phone">شماره تلفن</MenuItem>
									</TextField>
								</Grid>
								<Grid item xs={2} style={{ alignSelf: 'flex-end' }}>
									<Button
										fullWidth
										color="primary"
										type="submit">
										جستجو
									</Button>
								</Grid>
							</Grid>
						</form>
					</header>
					<section className={classes.users}>
						{users.map(user => (
							<Grid className={classes.row} container key={user.id}>
								<Grid item sm={1}>
									<Avatar src={utils.avatar.user(user.avatar, user.phone)} />
								</Grid>
								<Grid item sm>
									<Typography>{user.first_name + ' ' + user.last_name}</Typography>
								</Grid>
								<Grid item sm>
									<Typography>{user.phone}</Typography>
								</Grid>
								<Grid item sm>
									<Typography style={{textAlign: 'left'}}>{user.username}</Typography>
								</Grid>
								<Grid item sm>
									<Typography style={{textAlign: 'left'}}>{user.email}</Typography>
								</Grid>
								<Grid item sm={2} style={{textAlign: 'center'}}>
									<Button color="primary" onClick={this.handleShowDetails(user.id)}>نمایش جزئیات</Button>
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
						{selectedUser && 
							<div className={classes.modal}>
								<Typography>
									شماره کاربری: {selectedUser.id}
								</Typography>
								<Grid container spacing={8}>
									<Grid item xs={6}>
										<Typography>
											تاریخ عضویت: {utils.Miladi2Shamsi(selectedUser.created_at, 'jYYYY/jMM/jDD')}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography>
											تاریخ آخرین ویرایش: {utils.Miladi2Shamsi(selectedUser.updated_at, 'jYYYY/jMM/jDD')}
										</Typography>
									</Grid>
								</Grid>
								<FormValidation onSubmit={this.handleUpdateSelected}>
									<TextField
										onChange={this.handleChangeSelected('first_name')}
										value={selectedUser.first_name}
										label='نام'
										name='first_name'
										margin='dense'
										helperText='نام را وارد کنید'
										fullWidth
										required
									/>
									<TextField
										onChange={this.handleChangeSelected('last_name')}
										value={selectedUser.last_name}
										label='نام خانوادگی'
										name='last_name'
										margin='dense'
										helperText='نام خانوادگی را وارد کنید'
										fullWidth
										required
									/>
									<TextField
										onChange={this.handleChangeSelected('username')}
										value={selectedUser.username}
										label='نام کاربری'
										name='username'
										margin='dense'
										helperText='نام کاربری را وارد کنید'
										fullWidth
										required
									/>
									<TextField
										className={classes.textLeft}
										onChange={this.handleChangeSelected('email')}
										value={selectedUser.email || ''}
										label='ایمیل'
										name='email'
										margin='dense'
										fullWidth
										InputProps={{
											startAdornment: 
												<InputAdornment position='start'>
													<IconButton onClick={this.handleToggleVerify('email_validate')}>
														{selectedUser.email_validate
															? <AcceptIcon className={classes.accept} />
															: <DeclineIcon className={classes.decline} />
														}
													</IconButton>
												</InputAdornment>
										}}
									/>
									<TextField
										className={classes.textLeft}
										onChange={this.handleChangeSelected('phone')}
										value={selectedUser.phone}
										label='شماره'
										name='phone'
										margin='dense'
										helperText='شماره تلفن را وارد کنید'
										fullWidth
										required
										InputProps={{
											startAdornment: 
												<InputAdornment position='start'>
													<IconButton onClick={this.handleToggleVerify('phone_validate')}>
														{selectedUser.phone_validate
															? <AcceptIcon className={classes.accept} />
															: <DeclineIcon className={classes.decline} />
														}
													</IconButton>
												</InputAdornment>
										}}
									/>
									<Button
										fullWidth
										type='submit'
										color='primary'>
										بروزرسانی
									</Button>
									<Button
										onClick={this.handleDeleteAvatar}>
										حذف آواتار
									</Button>
									<Button
										color="secondary"
										onClick={this.handleDeleteUser}>
										حذف کاربر
									</Button>
								</FormValidation>
							</div>
						}
					</Modal>
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(AdminUsers);

