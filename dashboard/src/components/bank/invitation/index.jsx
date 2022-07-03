import API from 'api';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

// Elements
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import Title from 'components/title';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';

const styles = theme => ({
	root: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	action: {
		marginTop: theme.spacing.unit*2,
		marginBottom: theme.spacing.unit*2,
		textAlign: 'left',
		[theme.breakpoints.down('xs')]: {
			textAlign: 'center',
			'& > button': {
				width: '100%',
			}
		}
	},
	link: {
		margin: '0 5px',
		textDecoration: 'none',
		color: theme.palette.primary.dark,
		'&:hover': {
			color: theme.palette.primary.light,
		}
	},
	input: {
		direction: 'ltr',
	},
	en: {
		fontFamily: theme.fonts.en,
	},
	textFieldHalf: {
		width: '49%',
		[theme.breakpoints.down('sm')]: {
			width: '100%'
		}
	},
	textFieldMargin: {
		marginLeft: '2%',
		[theme.breakpoints.down('sm')]: {
			marginLeft: '0',
		}
	}
});

class Invitation extends Component{
	state = {
		sendLoading: false,
		showRegister: false,
		registerLoading: false,
		registerPhoneNumber: '',
		type: {
			value: '',
			label: '',
			type: '',
			pattern: '',
			maxLength: 0,
		},
	};

	types = [
		{
			value: 'phoneNumber',
			label: 'تلفن همراه',
			placeholder: 'برای مثال: 09121231234',
			helperText: 'شماره همراه را به صورت 11 رقمی وارد کنید',
			type: 'text',
			pattern: '^09\\d+$',
			maxLength: 11,
		},
		{
			value: 'username',
			label: 'نام کاربری',
			placeholder: 'برای مثال: Bankemoon@',
			helperText: 'نام کاربری باید از حروف انگلیسی، اعداد و _ تشکیل شده باشد',
			type: 'text',
			pattern: '^@[a-zA-Z0-9_]+$',
		},
		/* {
			value: 'securityNumber',
			label: 'کد ملی',
			placeholder: 'برای مثال: 1198526431',
			type: 'number',
		}, */
	];

	changeType = value => {
		let type = this.types.filter(t => t.value === value);
		type = type.length > 0 ? type[0] : this.types[0];
		this.setState({ type });
	};

	handleChangeType = e => {
		this.changeType(e.target.value);
	};

	handleError = err => {
		this.setState({
			sendLoading: false,
			registerLoading: false,
		});
		this.input.focus();
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: {
				value: true,
				text: 'باشه',
			},
		});
	};

	handleChange = name => e => {
		this.setState({
			[name]: e.target.value
		});
	};

	handleSubmit = (bankUsername, e) => {
		const formData = new FormData(e.currentTarget);
		const type = formData.get('key');
		const value = formData.get('value');
		if(type === 'username')
			formData.set('value', value.substr(1));
		swal({
			text: `از افتتاح حساب برای ${this.state.type.label} ${value} اطمینان دارید؟`,
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
		.then(v => {
			if(v){
				this.setState({ sendLoading: true });
				const key = 'client';
				const url = `/banks/${bankUsername}/clients`;
				const cb = {
					error: err => {
						if(err.code === 404){
							if(type === 'phoneNumber')
								return this.handleShowRegister(value);
							else
								err.message = 'کاربر وجود ندارد.\nشماره تلفن همراه ایشان را وارد کنید تا به بانکمون افزوده شود';
						}
						return this.handleError(err);
					},
					succeed: result => {
						this.setState({ sendLoading: false, value: '' });
						this.input.value = '';
						this.props.handleOpenSnack({
							message: 'حساب کاربر در بانک شما باز شد',
							variant: 'success',
						});
					}
				};
				API.Result(cb, this.API.put({ url, key, formData }));
			}
		});
	};

	handleShowRegister = phoneNumber => {
		this.setState({
			registerPhoneNumber: phoneNumber,
			showRegister: true,
			sendLoading: false,
		});
	};

	handleCloseRegister = () => {
		this.setState({
			registerPhoneNumber: '',
			showRegister: false,
			registerLoading: false,
		});
	};

	handleRegisterMember = e => {
		const formData = new FormData(e.currentTarget);
		this.setState({ registerLoading: true });
		const bankUsername = this.props.match.params.bankUsername;
		const key = 'register';
		const url = `/auth/${key}/${bankUsername}/`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.input.value = '';
				this.handleCloseRegister();
				this.props.handleOpenSnack({
					message: 'حساب کاربر در بانک شما باز شد',
					variant: 'success',
				});
			}
		};
		API.Result(cb, this.API.put({ url, key, formData }));
	};

	componentWillMount = () => {
		this.changeType('id');
		this.API = new API();
	};

	render(){
		const {
			classes,
			fullScreen,
		} = this.props;
		const {
			sendLoading,
			showRegister,
			registerLoading,
			registerPhoneNumber,
			type,
			value
		} = this.state;
		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}`;

		return(
			<Paper className={classes.root}>
				<Title
					label='باز کردن حساب جدید'
					help='/tutorial/'
					back={`${base}/`}
				/>
				<FormValidation onSubmit={this.handleSubmit.bind(this, bankUsername)}>
					<TextField
						name='key'
						fullWidth
						margin='normal'
						select
						label='طریقه افزودن حساب'
						onChange={this.handleChangeType}
						value={this.state.type.value}>
						{this.types.map(type => (
							<MenuItem
								key={type.value}
								value={type.value}
							>{type.label}</MenuItem>
						))}
					</TextField>

					<TextField
						name='value'
						margin='normal'
						type={type.type}
						label={type.label}
						placeholder={type.placeholder}
						helperText={type.helperText ? type.helperText : `لطفا ${type.label} را وارد کنید`}
						fullWidth
						autoFocus
						required
						onChange={e => this.setState({value: e.target.value})}
						inputProps={{
							pattern: type.pattern,
							maxLength: type.maxLength,
							ref: input => this.input = input,
							className: value
								? classNames(classes.input,
									type.value === 'username' ? classes.en : '')
								: ''
						}}
					/>

					<div className={classes.action}>
						<Button
							disabled={sendLoading}
							type='submit'
							color='primary'>
							افتتاح حساب
							<Loading show={sendLoading} />
						</Button>
					</div>
				</FormValidation>

				<Dialog open={showRegister} onClose={this.handleCloseRegister} fullScreen={fullScreen}>
					<DialogTitle>
						عضویت
					</DialogTitle>
					<DialogContent>
						<DialogContentText>
							این شماره برای هیچ کاربری ثبت نشده. اطلاعاتش رو وارد کنید تا عضو بانکمون بشه!
						</DialogContentText>
						<FormValidation onSubmit={this.handleRegisterMember}>
							<TextField
								autoFocus
								fullWidth
								required
								margin='normal'
								label='شماره همراه'
								name='phoneNumber'
								type='text'
								onChange={this.handleChange('registerPhoneNumber')}
								value={registerPhoneNumber}
							/>
							<TextField
								className={classNames(classes.textFieldHalf, classes.textFieldMargin)}
								required
								margin='normal'
								label='نام'
								name='firstName'
								type='text'
							/>
							<TextField
								className={classes.textFieldHalf}
								required
								margin='normal'
								label='نام خانوادگی'
								name='lastName'
								type='text'
							/>
							<DialogActions>
								<Button
									color='primary'
									fullWidth={fullScreen}
									onClick={this.handleCloseRegister}>بازگشت</Button>
								<Button
									fullWidth={fullScreen}
									disabled={registerLoading}
									color='primary'
									type='submit'>
									ثبت
									<Loading show={registerLoading} />
								</Button>
							</DialogActions>
						</FormValidation>
					</DialogContent>
				</Dialog>
			</Paper>
		);
	}
}

export default withMobileDialog()(withStyles(styles)(Invitation));
