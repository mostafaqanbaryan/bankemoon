import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import utils from 'utils';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Title from 'components/title';
import LogoLoading from 'components/loading/logo';
import FormValidation from 'components/formvalidation';

const styles = theme => ({
	avatar: {
		width: 70,
		height: 70,
		marginLeft: 'auto',
		marginRight: 'auto',
	},
	buttons: {
		marginTop: 2*theme.spacing.unit,
		textAlign: 'left',
		[theme.breakpoints.down('xs')]: {
			textAlign: 'center',
		}
	},
	editForm: {
		padding: theme.spacing.unit*2,
	},
	editFormName: {
		float: 'right',
		width: '70%',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			width: '100%',
		}
	},
	editLogoContainer: {
		float: 'left',
		textAlign: 'center',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			width: '100%',
			marginBottom: theme.spacing.unit*2,
		},
	},
	editFormLogo: {
		position: 'relative',
		display: 'block',
		// float: 'left',
		[theme.breakpoints.down('xs')]: {
			// float: 'none',
			// display: 'block',
			textAlign: 'center',
			width: '100%',
			// marginBottom: theme.spacing.unit*2,
		},
	},
	editLogo: {
		overflow: 'hidden',
		'&:after': {
			content: '"تغییر"',
			fontSize: '0.7rem',
			display: 'block',
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			height: 30,
			background: 'rgba(0, 0, 0, 0.4)',
			color: '#eee',
			textShadow: '0 0 3px #000',
		}
	},
	hidden: {
		display: 'none',
		opacity: 0
	},
	/* error: {
		background: theme.colors.error.background(0.7),
		color: '#FFF',
		textAlign: 'center',
		padding: theme.spacing.unit,
		whiteSpace: 'pre-line',
	}, */
});

class BankEdit extends React.Component{
	state = {
		error: null,
		avatarLoading: false,
	};

	handleError = err => this.props.handleOpenSnack({
		message: err.message,
		variant: 'error',
	});

	onSubmitEdit = e => {
		const formData = new FormData(e.currentTarget);
		const bankUsername = this.props.bankInfo.username;
		formData.delete('avatar');
		const key = 'bankEdit';
		const url = `/banks/${bankUsername}/`;
		const base = `/@${bankUsername}/`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					error: null,
				});
				// this.props.refreshInfo();
				// this.props.getBankOptions();
				this.props.updateBankInfo('name', formData.get('name'));
				this.props.updateBankOptions('rules', formData.get('rules'));
				this.props.updateBankOptions('description', formData.get('description'));
				this.props.updateBankOptions('shaba', formData.get('shaba'));
				this.props.updateBankOptions('owner', formData.get('owner'));
				this.props.history.push(base);
			}
		};
		API.Result(cb, this.API.patch({ url, key, formData }));
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
				return this.handleError(new Error('حداکثر حجم مجاز 128 کیلوبایت است'));
			}
			const bankUsername = this.props.bankInfo.username;
			const key = 'avatar';
			const url = `/banks/${bankUsername}/${key}`;
			const cb = {
				error: this.handleError,
				succeed: result => {
					this.setState({ avatarLoading: false });
					this.props.updateBankAvatar(result.data.avatar);
					this.props.handleOpenSnack({
						message: 'تصویر بانک بروز شد',
						variant: 'success'
					});
				}
			};
			API.Result(cb, this.API.file({ url, key, file }));
		};
		image.onerror = () => {
			this.handleError(new Error('عکس انتخاب شده معتبر نیست'));
		};
		image.src = URL.createObjectURL(file);
	};

	handleDeleteAvatar = e  => {
		if(!this.props.bankInfo.avatar)
			return;
		const bankUsername = this.props.bankInfo.username;
		const key = 'avatar';
		const url = `/banks/${bankUsername}/${key}`;
		const temp = this.props.bankInfo.avatar;
		this.props.updateBankAvatar(null);
		const cb = {
			error: err => {
				this.props.updateBankAvatar(temp);
				this.handleError(err);
			},
			succeed: result => { }
		};
		API.Result(cb, this.API.delete({ url, key }));
	};

	componentDidMount = () => {
		this.props.getBankOptions();
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const { 
			classes,
			bankInfo,
			bankOptions,
		} = this.props;

		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}/`;
		if(bankInfo && bankOptions){
			return(
				<Paper>
					<Title padding back={base} help='/tutorial/banks/edit/' label={`ویرایش ${bankInfo.name}`} />
					<FormValidation
						onSubmit={this.onSubmitEdit}
						className={classes.editForm}>
						<div className={classes.editLogoContainer}>
							<label className={classes.editFormLogo} htmlFor='avatar'>
								<IconButton component='span' className={classNames(classes.avatar, classes.editLogo)}>
									<Avatar className={classes.avatar} src={utils.avatar.bank(bankInfo.avatar, bankInfo.username)} />
								</IconButton>
							</label>
							<Button color='secondary' style={{ fontSize: '0.7rem' }} onClick={this.handleDeleteAvatar}>
								حذف تصویر
							</Button>
						</div>

						<TextField
							className={classes.editFormName}
							name='name'
							defaultValue={bankInfo.name}
							required
							fullWidth
							label='نام بانک'
							type='text'
							helperText='نام باید از حروف فارسی تشکیل شده باشد'
							InputProps={{
								autoComplete:'off'}}
							inputProps={{
								pattern:"^[پضصثقفغعهخحجچشسیبلاتنمکگظطزرذدئوآ\\s‌]+$",
								autoComplete:'off'}}
						/>
						<Grid spacing={16} container>
							<Grid item xs={12} md={6}>
								<TextField
									name='shaba'
									defaultValue={bankInfo.shaba}
									fullWidth
									label='شماره شبا'
									type='text'
									helperText='شماره شبا برای انتقال وجه'
									InputProps={{
										autoComplete:'off'}}
									inputProps={{
										autoComplete:'off'}}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									defaultValue={bankInfo.owner}
									fullWidth
									label='نام کامل صاحب حساب'
									type='text'
									helperText='نام صاحب حساب برای صحت شماره شبا'
									InputProps={{
										autoComplete:'off'}}
									inputProps={{
										autoComplete:'off'}}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									name='rules'
									defaultValue={bankOptions.rules}
									rows={3}
									multiline
									fullWidth
									margin='normal'
									label='قوانین'
									type='text'
									helperText='شرایط لازم برای عضویت کاربران جدید به صورت سطر به سطر'
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									name='description'
									defaultValue={bankOptions.description}
									rows={3}
									multiline
									margin='normal'
									helperText='چند کلمه توضیح درباره بانک'
									fullWidth
									label='توضیحات'
									type='text'
								/>
							</Grid>
						</Grid>

						<div className={classes.buttons}>
							<input
								className={classes.hidden}
								id='avatar'
								name='avatar'
								type='file'
								accept='image/jpeg'
								ref={ref => this.uploadInput = ref}
								onChange={this.handleUploadAvatar}
							/>
							<Button
								component='a'
								href='/blog/tutorials/shaba/'
								rel='index,follow'>
								دریافت شماره شبا
							</Button>
							<Button
								type="submit"
								color="primary">ذخیره</Button>
						</div>
					</FormValidation>
				</Paper>
			);
		}else
			return (<LogoLoading center />);
	}
}

export default withStyles(styles)(BankEdit);
