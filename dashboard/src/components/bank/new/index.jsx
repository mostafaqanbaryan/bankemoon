import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import utils from 'utils';

// Elements
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import Title from 'components/title';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit*2
	},
	// halfWidth: {
		// width: '50%',
		// [theme.breakpoints.down('xs')]: {
			// width: '100%'
		// }
	// },
	btnContainer: {
		marginTop: theme.spacing.unit*2,
		'&:after': {
			content: '""',
			display: 'block',
			float: 'none',
			clear: 'both',
		}
	},
	btn: {
		float: 'left',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			width: '100%'
		}
	},
	textLeft: {
		fontFamily: theme.fonts.en,
		textAlign: 'left',
		direction: 'ltr',
	},
	link: {
		color: theme.colors.primary(1),
		fontSize: '0.7rem',
	},
	error: {
		background: theme.colors.error.background(0.7),
		color: '#FFF',
		textAlign: 'center',
		padding: theme.spacing.unit,
		whiteSpace: 'pre-line',
		marginTop: theme.spacing.unit,
	},
});

class NewBank extends React.Component{
	state = {
		bankUsername: '',
		bankInitial: '',
		error: null,
		loading: false,
	};

	handleChange = name => e => {
		const value = e.target.value;
		if(name === 'bankInitial')
			this.setState({ [name]: utils.sanitize.money(value) });
		else
			this.setState({ [name]: value });
	};

	handleError = err => {
		this.setState({ loading: false });
		this.props.handleOpenSnack({
			message: err.message,
			variant: 'error',
		});
	};

	handleSubmit = e => {
		this.setState({ loading: true });
		const formData = new FormData(e.currentTarget);
		if(!this.state.bankInitial)
			formData.delete('initial');
		const name = formData.get('name');
		const key = 'bankCreate';
		const url = `/banks/`;
		const base = `/@${this.state.bankUsername}/`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.props.handleOpenSnack({
					message: `${name} با موفقیت ساخته شد`,
					variant: 'success',
				});
				this.props.history.push(base);
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes
		} = this.props;

		const {
			bankUsername,
			bankInitial,
			loading,
			error,
		} = this.state;

		return (
			<Paper className={classes.root}>
				<Title back='/' label="ایجاد بانک جدید" />
				<FormValidation onSubmit={this.handleSubmit}>
					<TextField
						type="text"
						name="name"
						margin="normal"
						label="نام فارسی بانک"
						required
						fullWidth
						autoFocus
						helperText='نام باید از حروف فارسی تشکیل شده باشد'
						InputProps={{
							autoComplete:'off'}}
						inputProps={{
							pattern: "^[ضصثقفغعهخحجچشسیبلاتنمکگپظطزرذدئوژآ‌\\s]+$",
							autoComplete:'off'}}
					/>
					<TextField
						type="text"
						name="username"
						margin="normal"
						label="نام انگلیسی بانک"
						required
						fullWidth
						value={bankUsername}
						onChange={this.handleChange('bankUsername')}
						helperText='نام انگلیسی حداقل باید دارای 5 کاراکتر بوده، با حروف شروع شده و شامل ارقام,  حروف و _ باشد'
						InputProps={{
							autoComplete:'off'}}
						inputProps={{
							className: classes.textLeft,
							pattern:'^(?=[A-Za-z])([A-Za-z0-9_]{5,})$',
							autoComplete:'off'}}
					/>

					<Typography className={classNames(classes.textLeft, classes.link)}>
						https://bankemoon.com/@{bankUsername}
					</Typography>

					<div>
						<TextField
							type="text"
							name="initial"
							margin="normal"
							label="سرمایه اولیه"
							fullWidth
							value={utils.money(bankInitial)}
							onChange={this.handleChange('bankInitial')}
							helperText='توجه داشته باشید که سرمایه اولیه هر شخص به صورت مجزا در هنگام عضویت قابل تعیین است'
							InputProps={{
								autoComplete:'off'}}
							inputProps={{
								className: classes.textLeft,
								autoComplete:'off'}}
						/>
					</div>

					<div>
						{error &&
							<Typography className={classes.error}>
								{error}
							</Typography>
						}
					</div>

					<div className={classes.btnContainer}>
						<Button
							className={classes.btn}
							fullWidth
							disabled={loading}
							color='primary'
							type="submit">
							ثبت
							<Loading show={loading} />
						</Button>
					</div>
				</FormValidation>
			</Paper>
		);
	}
}

export default withStyles(styles)(NewBank);

