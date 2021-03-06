import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import swal from 'sweetalert';
import utils from 'utils';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import Square from 'components/square';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';
import ErrorBoundary from 'components/errorBoundary';

// Icon
import AcceptIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Cancel';
import DeleteIcon from '@material-ui/icons/Delete';
import ChangePhotoIcon from '@material-ui/icons/AddAPhoto';

const styles = theme => ({
	root: {
		marginBottom: theme.spacing.unit*2,
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
		'&:after':{
			content: '""',
			display: 'block',
			float: 'none',
			clear: 'both',
		}
	},
	right: {
		float: 'right',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			clear: 'both',
			textAlign: 'center',
			margin: '0 auto',
			marginBottom: theme.spacing.unit*3,
		}
	},
	left: {
		float: 'left',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			clear: 'both',
			textAlign: 'center',
			margin: '0 auto',
		}
	},
	header: {
		marginBottom: theme.spacing.unit*3,
		textAlign: 'center'
	},
	item: {
		padding: theme.spacing.unit*2,
		background: '#f9f9f9',
		boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12)'
	},
	avatar: {
		height: 96,
		width: 96,
		margin: '0 auto',
	},
	hidden: {
		display: 'none'
	},
	inputHolder: {
		display: 'flex',
		justifyContent: 'flex-start',
		alignItems: 'center',
		[theme.breakpoints.down('xs')]:{
			justifyContent: 'center',
		}
	},
	accept: {
		color: '#3c6'
	},
	error: {
		color: '#d53'
	},
	en: {
		fontFamily: theme.fonts.en,
		textAlign: 'left',
		direction: 'ltr',
	},
	password: {
		width: '40%',
		marginBottom: theme.spacing.unit*2,
		[theme.breakpoints.down('xs')]: {
			width: '100%',
			float: 'none',
			clear: 'both',
		}
	},
	passwordRight: {
		float: 'right',
	},
	passwordLeft: {
		float: 'left',
	},
	submit: {
		clear: 'both',
		float: 'left',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			textAlign: 'center',
		}
	},
});

class Edit extends React.Component {
	state = {
		me: null,
		error: null,
		phone: '',
		email: '',
		username: '',
		isEmailOpen: false,
		isPhoneOpen: false,
		emailActivationCode: '',
		phoneActivationCode: '',
		avatarLoading: false,
		emailVerifiactionLoading: false,
		phoneVerifiactionLoading: false,
		usernameVerifiactionLoading: false,
	};

	handleChange = (name, pattern=null) => e => {
		const me = this.state.me;
		let value = e.target.value;
		let validation = true;
		if(name === 'phone')
			value = utils.sanitize.phone(value);
		else if(me && name === 'email' ){
			if(me.email === value)
				me.email_validate = true;
			else
				me.email_validate = false;
		}
		if(pattern) {
			let re = new RegExp(pattern);
			validation = value.search(re) !== -1;
		}
		this.setState({
			me,
			[name + '_validation']: validation,
			[name]: value
		});
	};

	handleError = err => {
		this.setState({
			avatarLoading: false,
			changePasswordLoading: false,
			emailVerifiactionLoading: false,
			phoneVerifiactionLoading: false,
			usernameVerifiactionLoading: false,
			emailActivationCode: '',
			phoneActivationCode: '',
		});
		swal({
			title: '??????',
			text: err.message,
			icon: 'error',
			button: {
				text: '????????',
			}
		});
	};

	getMe = () => {
		const key = 'me';
		const url = `/users/${key}`;
		const cb = {
			error: err => this.setState({
				error: err.message,
				changePasswordLoading: false,
				emailVerifiactionLoading: false,
				phoneVerifiactionLoading: false,
				emailActivationCode: '',
				phoneActivationCode: '',
			}),
			succeed: result => {
				this.setState({
					me: result.data.user,
					phone: result.data.user.phone,
					email: result.data.user.email,
					username: result.data.user.username,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	updateUserAvatar = avatar => {
		this.props.updateUserAvatar(avatar);
		const me = this.state.me;
		me.avatar = avatar;
		this.setState({ me });
	};

	handleUploadAvatar = e  => {
		if(this.uploadInput.files.length <= 0)
			return;
		this.setState({ avatarLoading: true });
		const file = this.uploadInput.files[0];
		const image = new Image();
		image.onload = () => {
			// Check size
			if(file.size > 128*1024){
				return this.handleError(new Error('???????????? ?????? ???????? 128 ???????????????? ??????'));
			}
			const key = 'avatar';
			const url = `/users/me/${key}`;
			const cb = {
				error: this.handleError,
				succeed: result => {
					const avatar = result.data.avatar;
					this.setState({
						avatarLoading: false,
					});
					this.updateUserAvatar(avatar);
					this.props.handleOpenSnack({
						message: '?????? ?????? ???????? ????',
						variant: 'success'
					});
				}
			};
			API.Result(cb, this.API.file({ url, key, file }));
		};
		image.onerror = () => {
			this.handleError(new Error('?????? ???????????? ?????? ?????????? ????????'));
		};
		image.src = URL.createObjectURL(file);
	};

	handleDeleteAvatar = e  => {
		if(!this.state.me.avatar)
			return;
		const key = 'avatar';
		const url = `/users/me/${key}`;
		const temp = this.state.me.avatar;
		this.updateUserAvatar(null);
		const cb = {
			error: err => {
				this.updateUserAvatar(temp);
				this.handleError(err);
			},
			succeed: result => { }
		};
		API.Result(cb, this.API.delete({ url, key }));
	};

	handleChangePassword = e => {
		const formData = new FormData(e.currentTarget);
		formData.delete('validatePassword');
		swal({
			text: '???? ?????????? ?????? ???????? ?????????????? ????????????',
			icon: 'warning',
			buttons: {
				cancel: {
					value: null,
					visible: true,
					text: '????',
				},
				confirm: {
					value: true,
					text: '??????',
				},
			},
		})
		.then(value => {
			if(value){
				this.setState({ changePasswordLoading: true });
				const key = 'password';
				const url = `/users/me/password`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						this.setState({ changePasswordLoading: false });
						this.props.handleOpenSnack({
							message: '?????? ???????? ???? ???????????? ???????? ????',
							variant: 'success',
						});
					}
				};
				API.Result(cb, this.API.put({ url, key, formData }));
			}
		});
	};

	handleChangeTwoStepVerification = e => {
		if(e.target.checked) {
			swal({
				text: '???? ???????????????? ???????? ????????????????????? ?????????????? ????????????',
				icon: 'warning',
				buttons: {
					cancel: {
						value: null,
						visible: true,
						text: '????',
					},
					confirm: {
						value: true,
						text: '??????',
					},
				},
			})
			.then(value => {
				if(value){
					this.changeTwoStepVerification(e);
				}
			});
		}
		else {
			this.changeTwoStepVerification(e);
		}
	};

	changeTwoStepVerification = e => {
		const me = this.state.me;
		me.two_step_verification = !me.two_step_verification;
		this.setState({ me });
		const formData = new FormData();
		formData.set('value', me.two_step_verification);
		const key = 'two-step-verification';
		const url = `/users/me/${key}`;
		const cb = {
			error: err => {
				this.handleError(err);
				me.two_step_verification = !me.two_step_verification;
				this.setState({ me });
			},
			succeed: result => {}
		};
		API.Result(cb, this.API.put({ url, key, formData }));
	}

	onSendEmailVerification = e => {
		const email = this.state.email;
		if(!email){
			return swal({
				text: '?????????? ?????????? ?????? ???? ???????? ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}
		const isValid = email.match(/^[^@]+@[a-z0-9]+\.[a-z]+$/i);
		if(isValid){
			swal({
				text: `???? ?????? ${email} ?????????????? ????????????`,
				icon: 'warning',
				buttons: {
					cancel: {
						value: null,
						visible: true,
						text: '????',
					},
					confirm: {
						value: true,
						text: '??????',
					},
				},
			})
			.then(value => {
				if(value){
					this.setState({ emailVerifiactionLoading: true });
					const formData = new FormData();
					formData.set('email', this.state.email);
					const key = 'email';
					const url = `/users/me/${key}`;
					const cb = {
						error: this.handleError,
						succeed: result => {
							this.setState({
								isEmailOpen: true,
								emailVerifiactionLoading: false,
								emailActivationCode: '',
							});
							this.props.handleOpenSnack({
								message: '?????????? ?????????? ????',
								variant: 'success',
							});
						}
					};
					API.Result(cb, this.API.put({ url, key, formData }));
				}
			});
		}else{
			swal({
				text: '?????????? ?????? ???? ???? ?????? ???????? ???????? ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}
	};

	onSendUsernameVerification = e => {
		const username = this.state.username;
		if(this.state.me.username === username)
			return;

		const isValid = username.search(/^(?=[A-Za-z])([A-Za-z0-9_]{5,})$/);
		if(isValid === -1){
			return swal({
				text: '?????? ???????????? ????????????????? ???????? ???????? ???????????????? ?????????? ?? _ ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}

		this.setState({ userVerifiactionLoading: true });
		const formData = new FormData();
		formData.set('username', this.state.username);
		const key = 'username';
		const url = `/users/me/${key}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				let me = this.state.me;
				me.username = this.state.username;
				this.setState({
					usernameVerifiactionLoading: false,
					me
				});
				this.props.handleOpenSnack({
					message: '?????? ???????????? ?????????? ????',
					variant: 'success',
				});
			}
		};
		API.Result(cb, this.API.put({ url, key, formData }));
	};

	handleEmailValidation = e => {
		const code = this.state.emailActivationCode;
		if(code){
			this.setState({ emailVerifiactionLoading: true });
			const formData = new FormData();
			formData.set('code', code);
			const key = 'email';
			const url = `/users/me/${key}`;
			const cb = {
				error: this.handleError,
				succeed: result => {
					this.handleClose(e);
					let me = this.state.me;
					me.email = this.state.email;
					me.email_validate = true;
					this.setState({
						me,
						emailActivationCode: '',
						emailVerifiactionLoading: false
					});
					this.props.handleOpenSnack({
						message: '?????????? ???? ???????????? ?????? ????',
						variant: 'success',
					});
				}
			};
			API.Result(cb, this.API.patch({ url, key, formData }));
		}else{
			swal({
				text: '???? ???????????????? ???? ???? ?????? ????????  ???????? ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}
	};

	onSendPhoneVerification = e => {
		const elem = document.getElementById('phoneNumber');
		const phoneNumber = elem.value ? elem.value : elem.placeholder;
		const isValid = phoneNumber.match(/^(0098|98|\+98|0)?9\d{9}$/);
		if(phoneNumber && isValid){
			swal({
				text: `???? ?????? ${phoneNumber} ?????????????? ????????????`,
				icon: 'warning',
				buttons: {
					confirm: {
						value: true,
						text: '??????',
					},
					cancel: {
						value: null,
						visible: true,
						text: '????',
					},
				},
			})
			.then(value => {
				if(value) {
					this.setState({ isPhoneOpen: true });
				}
			});
		}else if(phoneNumber && !isValid){
			swal({
				text: '?????????? ?????? ???? ???? ?????? 11 ???????? ???????? ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}else{
			swal({
				title: '?????????? ??????????',
				text: '?????????? ???????????? ??????????????...',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}
	};

	handlePhoneValidation = e => {
		const value = document.getElementById('phone-activation').value;
		if(value){
			this.handleClose(e);
			swal({
				text: '???????? ?????? ?????????? ????',
				icon: 'success',
				button: {
					value: true,
					text: '????????',
				},
			});
			this.props.refreshUser('phoneVerifiaction', true);
		}else{
			swal({
				text: '?????? ???? ???? ?????? ????????  ???????? ????????',
				icon: 'error',
				button: {
					value: true,
					text: '????????',
				},
			})
		}
	};

	handleClose = e => {
		this.setState({
			isEmailOpen: false,
			isPhoneOpen: false,
		});
	};

	handleDeleteUser = e => {
		swal({
			text: '???? ?????? ???????? ?? ?????????????? ?????? ????????????\n???? ?????? ???????? ?????????????? ?? ????????????????? ?????? ???? ???????? ???????? ?????? ??????\n?? ???????? ???????????? ?????????????????',
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					value: null,
					visible: true,
					text: '????',
				},
				confirm: {
					value: true,
					text: '?????? ????',
				},
			},
		})
		.then(value => {
			if(value){
				this.setState({ loadingDelete: true });
				const key = 'me';
				const url = `/users/${key}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						this.setState({ loadingDelete: false });
						this.props.history.replace('/auth/logout/');
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentDidMount = () => {
		this.getMe();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			me,
			error,
			phone,
			email,
			username,
			username_validation,
			isEmailOpen,
			isPhoneOpen,
			avatarLoading,
			emailActivationCode,
			phoneActivationCode,
			changePasswordLoading,
			emailVerifiactionLoading,
			usernameVerifiactionLoading,
		} = this.state;

		const {
			classes,
			fullScreen
		} = this.props;

		return (
			<ErrorBoundary error={error} reload={this.getMe}>
				<Paper className={classes.root}>
					<Grid container spacing={0} className={classes.header}>
						<Grid item className={classes.item} xs={12} sm={4}>
							<Typography>
								{me
									? me.first_name + ' ' + me.last_name
									: '...'
								}
							</Typography>
						</Grid>
						<Grid item className={classes.item} xs={12} sm={4}>
							<Typography className={classes.en} style={{ textAlign: 'center' }}>
								{me && me.username
									? `@${me.username}`
									: '?????? ???????????? ???????? ??????????'
								}
							</Typography>
						</Grid>
						<Grid item className={classes.item} xs={12} sm={4}>
							<Typography>
								{me
									? `?????????? ???????????? ${me.id}`
									: '...'
								}
							</Typography>
						</Grid>
					</Grid>
					<section className={classes.right}>
						<div className={classes.inputHolder}>
							<TextField
								disabled
								id="phoneNumber"
								name="phoneNumber"
								label='??????????'
								value={utils.phone(phone)}
								onChange={this.handleChange('phone')}
								helperText={me && me.phone_validate
									? '?????????? ?????? ?????????? ?????? ??????'
									: '?????????? ?????? ???????? ?????????? ???????? ??????'
								}
								inputProps= {{
									className: classes.en,
									pattern: '^0\d{3}\-\d{3}\-\d{4}$'
								}}
								FormHelperTextProps={
									me && me.phone_validate 
										? { className: classes.accept }
										: { className: classes.error }
								}
							/>
							{me && me.phone_validate
								? <IconButton>
										<AcceptIcon className={classes.accept} />
									</IconButton>
								: <Tooltip title="???????? ?????????? ???????? ????????">
										<IconButton onClick={this.onSendPhoneVerification}>
											<ErrorIcon className={classes.error} />
										</IconButton>
									</Tooltip>
							}
						</div>
						<div className={classes.inputHolder}>
							<TextField
								id="email"
								name="email"
								label='??????????'
								type='email'
								value={email}
								onChange={this.handleChange('email')}
								helperText={me && me.email_validate
									? '?????????? ?????? ?????????? ?????? ??????'
									: '?????????? ?????? ???????? ?????????? ???????? ??????'
								}
								inputProps= {{
									className: classes.en
								}}
								FormHelperTextProps={
									me && me.email_validate 
										? { className: classes.accept }
										: { className: classes.error }
								}
							/>
							{me && me.email_validate
								? <IconButton>
										<AcceptIcon className={classes.accept} />
									</IconButton>
								: <Tooltip title="???????? ?????????? ???????? ????????">
										<IconButton disabled={emailVerifiactionLoading} onClick={this.onSendEmailVerification}>
											{emailVerifiactionLoading
												? <Loading show={emailVerifiactionLoading} />
												: <ErrorIcon className={classes.error} />
											}
										</IconButton>
									</Tooltip>
							}
						</div>
						<div className={classes.inputHolder}>
							<TextField
								id="username"
								name="username"
								label='?????? ????????????'
								type='username'
								value={username}
								onChange={this.handleChange('username')}
								helperText={me && me.username
									? '?????? ???????????? ?????? ?????????? ?????? ??????'
									: '?????? ?????? ???????????? ?????????? ???????????????????'
								}
								inputProps= {{
									className: classes.en
								}}
								FormHelperTextProps={
									me && me.username
										? { className: classes.accept }
										: { className: classes.error }
								}
							/>
							{me && me.username
								? <IconButton disabled={usernameVerifiactionLoading} onClick={this.onSendUsernameVerification}>
										<AcceptIcon className={classes.accept} />
									</IconButton>
								: <Tooltip title="???????? ?????????? ???????? ????????">
										<IconButton disabled={usernameVerifiactionLoading} onClick={this.onSendUsernameVerification}>
											{usernameVerifiactionLoading
												? <Loading show={usernameVerifiactionLoading} />
												: <ErrorIcon className={classes.error} />
											}
										</IconButton>
									</Tooltip>
							}
						</div>
					</section>
					<section style={!me || !me.avatar ? {textAlign: 'center'} : {}} className={classes.left}>
						<div>
							{!me
								? <Square className={classes.avatar} height={96} weight={96} />
								: <img className={classes.avatar} src={utils.avatar.user(me.avatar, me.phone)} alt='?????? ??????' />
							}
						</div>
						<input
							className={classes.hidden}
							type="file"
							accept="image/jpeg"
							id="avatar-file"
							ref={ref => this.uploadInput = ref}
							onChange={this.handleUploadAvatar}
						/>
						<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
							<label htmlFor="avatar-file">
								{avatarLoading
									? <Loading show={avatarLoading} />
									: <IconButton component='span'>
											<ChangePhotoIcon />
										</IconButton>
								}
							</label>
							{me && me.avatar &&
								<IconButton color='secondary' onClick={this.handleDeleteAvatar} disabled={avatarLoading}>
									<DeleteIcon />
								</IconButton>
							}
						</div>
					</section>
				</Paper>

				<Paper className={classes.root}>
					<Typography gutterBottom variant='title'>?????????? ???????? ????????</Typography>
					<FormValidation autoComplete="off" onSubmit={this.handleChangePassword}>
						<TextField
							className={classes.en}
							name="oldPassword"
							label='?????? ???????? ????????'
							type='password'
							helperText='?????? ???????? ???????? ?????? ???? ???????? ????????'
							margin='normal'
							required
							fullWidth
							InputProps={{autoComplete:'off'}}
							inputProps={{className: classes.textLeft, autoComplete:'off'}}
						/>
						<TextField
							className={classNames(classes.en, classes.password, classes.passwordRight)}
							name="password"
							label='?????? ????????'
							type='password'
							helperText='?????? ???????? ???????? ?????????? ???????? 8 ?????? ?? ?????? ????????'
							margin='normal'
							required
							InputProps={{autoComplete:'off'}}
							inputProps={{
								className: classes.textLeft,
								autoComplete:'off',
								pattern: "^(?=.*[0-9])(?=.*[a-zA-Z])(.{8,})$"
							}}
						/>
						<TextField
							className={classNames(classes.en, classes.password, classes.passwordLeft)}
							name="validatePassword"
							label='?????????? ?????? ????????'
							type='password'
							helperText='?????? ???????? ???? ???? ???????? ???????? ?????????? ????????'
							margin='normal'
							required
							InputProps={{autoComplete:'off'}}
							inputProps={{
								className: classes.textLeft,
								autoComplete:'off',
								"sameAs": 'newPassword'
							}}
						/>
						<div className={classes.submit}>
							<Button
								type='submit'
								color='primary'
								disabled={changePasswordLoading}>
								??????????
								<Loading show={changePasswordLoading} />
							</Button>
						</div>
					</FormValidation>
				</Paper>

				<Paper className={classes.root}>
					<Typography gutterBottom variant='title'>????????????</Typography>
					<section style={{ borderBottom: '1px solid #ddd', paddingBottom: 24 }}>
						<FormControlLabel
							label='???????????????? ???????? ?????????????????????'
							control={
								<Checkbox
									disabled
									checked={me ? me.two_step_verification : false}
									onChange={this.handleChangeTwoStepVerification}
								/>
							}
						/>
						<Typography variant='caption' style={{ marginRight: 32, textAlign: 'justify' }}>
							???? ???????????????? ?????? ?????????? ???????? ???????? ???? ?????????????? ???? ???? ???????????? ???? ?????????? ?????? ?????????? ?????????????
						</Typography>
					</section>
					<section style={{ marginTop: 16, direction: 'ltr' }}>
						<Button color='secondary' onClick={this.handleDeleteUser}>?????? ???????? ????????????</Button>
					</section>
				</Paper>

				<Dialog
					fullScreen={fullScreen}
					open={isEmailOpen}
					onClose={this.handleClose}
					aria-labelledby="email-activation-dialog">
					<DialogTitle id="email-activation-dialog">???? ????????????????</DialogTitle>
					<DialogContent>
						<DialogContentText>
							???????? ?????? ?????????? ?????? ???? ?????????? ?????? ???? ???? ???????? ?????? ???????? ????????????
						</DialogContentText>
						<TextField
							autoFocus
							margin='dense'
							id="email-activation"
							name="email-activation"
							label="?????? ?????????? ????????"
							value={emailActivationCode}
							onChange={this.handleChange('emailActivationCode')}
							fullWidth />
					</DialogContent>
					<DialogActions>
						<Button
							onClick={this.handleClose}
							color="secondary"
							>??????</Button>
						<Button
							onClick={this.handleEmailValidation}
							disabled={emailVerifiactionLoading}
							color="primary">
							??????????
							<Loading show={emailVerifiactionLoading} />
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog
					open={isPhoneOpen}
					onClose={this.handleClose}
					aria-labelledby="phone-activation-dialog">
					<DialogTitle id="phone-activation-dialog">???? ????????????????</DialogTitle>
					<DialogContent>
						<DialogContentText>
							???????? ?????? ?????????? ?????? ???? ???????? ?????????? ?????? ???? ???? ???????? ?????? ???????? ????????????
						</DialogContentText>
						<TextField
							autoFocus
							margin='dense'
							id="phone-activation"
							name="phone-activation"
							label="?????? ?????????? ????????"
							value={phoneActivationCode}
							onChange={this.handleChange('phoneActivationCode')}
							fullWidth />
					</DialogContent>
					<DialogActions>
						<Button
							onClick={this.handleClose}
							color="secondary"
							>??????</Button>
						<Button
							onClick={this.handlePhoneValidation}
							color="primary"
							>??????????</Button>
					</DialogActions>
				</Dialog>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(withMobileDialog()(Edit));
