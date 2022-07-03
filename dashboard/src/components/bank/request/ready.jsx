import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import propTypes from 'prop-types';
import swal from 'sweetalert';
import Title from 'components/title';

// Elements
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
	paper: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
		marginTop: theme.spacing.unit*2,
	},
	action: {
		textAlign: 'left',
	},
	progress: {
		top: theme.header.height
	},
	link: {
		color: theme.palette.primary.main,
		textDecoration: 'none',
		'&:hover': {
			color: theme.palette.primary.light,
		},
		'&:active': {
			color: theme.palette.primary.dark,
		},
		'&:visited': {
			color: theme.palette.secondary.main,
		},
		'&:visited:hover': {
			color: theme.palette.secondary.light,
		},
		'&:visited:active': {
			color: theme.palette.secondary.dark,
		},
	}
});


class Request extends React.Component{
	state = {
		bankOptions: {}
	};

	handleError = err => {
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: 'باشه',
			// className: this.props.classes.swal,
		});
	};

	handleSend = () => {
		const bankUsername = this.props.bankInfo.username;
		const key = 'clients';
		const url = `/banks/${bankUsername}/${key}/`;
		const cb = {
			error: this.handleError,
			limited: this.handleError,
			succeed: (result => {
				swal({
					title: 'ارسال شد',
					text: 'ارسال درخواست عضویت با موفقیت انجام شد',
					icon: 'success',
					button: 'باشه',
					className: this.props.classes.swal,
				});
				this.props.history.push('/');
			})
		};
		API.Result(cb, this.API.post({ url, key }));
	};

	getRequestOptions = bankUsername => {
		const key = 'options';
		const url = `/banks/${bankUsername}/${key}`;
		const cb = {
			error: this.handleError,
			limited: this.handleError,
			succeed: (result => {
				this.setState({
					bankOptions: result.data.options,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	componentDidMount = () => {
		this.API = new API();
		const bankUsername = this.props.match.params.bankUsername;
		// const bankUsername = this.props.getBankUsername();
		this.getRequestOptions(bankUsername);
	};

	render(){
		const {
			classes,
			bankInfo,
		} = this.props;

		const {
			bankOptions,
		} = this.state;

		const base = '/';
		return(
			<div>
				<Paper>
					<Title back={base} padding label={`ارسال درخواست عضویت به ${bankInfo.name}`} />
				</Paper>
				<Paper className={classes.paper}>
					<h3>درباره {bankInfo.name}</h3>
					{bankOptions && bankOptions.description 
						? bankOptions.description
						: 'توضیحاتی ذکر نشده است'}
					<h3>قوانین {bankInfo.name}</h3>
					{bankOptions && bankOptions.rules 
						? bankOptions.rules
						: 'قانون خاصی مطرح نشده است'}
					<h3>شرایط کلی بانکمون</h3>
					<ul>
						<li>
							مدیران قرض‌الحسنه به هیچ نحوی به بانکمون مرتبط نیستند.
						</li>
						<li>
							بانکمون صرفا محلی برای ثبت وقایع و مدیریت قرض‌الحسنه است و هیچگونه منبع مالی ندارد.
						</li>
						<li>
							ارسال درخواست عضویت به منزله‌ی مطالعه و تایید <a className={classes.link} target='_blank' href='/terms/'>قوانین بانکمون</a> و قرض‌الحسنه‌ی {bankInfo.name} است.
						</li>
					</ul>
					<div className={classes.action}>
						<Button color='secondary' onClick={this.handleSend}>ارسال</Button>
					</div>
				</Paper>
			</div>
		);
	}
}

Request.propTypes = {
	types				 : propTypes.array.isRequired,
	handleSubmit : propTypes.func.isRequired,
};
// export default withRouter(withStyles(styles)(Request));
export default withStyles(styles)(Request);
