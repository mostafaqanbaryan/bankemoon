import API from 'api';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';

// Elements
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Title from 'components/title';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit*2
	},
	halfWidth: {
		width: '50%',
		[theme.breakpoints.down('xs')]: {
			width: '100%'
		}
	},
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
	}
});

class NewTicket extends Component{
	state = {
		base: '/tickets/',
		types: [
			{
				value: 'Technical',
				label: 'فنی',
			},
			{
				value: 'Financial',
				label: 'مالی',
			},
			{
				value: 'Design',
				label: 'طراحی',
			},
			{
				value: 'Suggestions',
				label: 'پیشنهادات',
			},
			{
				value: 'Management',
				label: 'ارتباط با مدیریت',
			},
		],
		selectedType: 'Technical',
		sendLoading: false,
	}

	handleError = result => {
		this.setState({
			// error: result.message
			sendLoading: false,
		});
		let message = result.message;
		swal({
			title: 'خطا',
			text: message,
			icon: 'error',
			buttons: {
				confirm: {
					value: true,
					text: 'باشه',
				}
			}
		});
	}

	handleSubmit = e => {
		this.setState({ sendLoading: true });
		const key = 'tickets';
		const url = `/users/${key}/`;
		const formData = new FormData(e.target);
		const cb = {
			error: this.handleError,
			limited: this.handleError,
			succeed: (result => {
				this.setState({
					sendLoading: false,
					// error: null,
				});
				swal({
					title: 'ارسال شد',
					text: 'جواب شما در اسرع وقت داده خواهد شد',
					icon: 'success',
					buttons: {
						confirm: {
							value: true,
							text: 'باشه',
						}
					}
				});
				this.props.history.push(this.state.base + result.data.ticket.id + '/');
			})
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	}

	handleChange = name => e => {
		const value = e.target.value;
		this.setState({ [name]: value });
	}

	componentDidMount = () => {
		this.API = new API();
	}

	render(){
		const {
			classes
		} = this.props;
		const {
			selectedType,
			types,
			base,
			sendLoading
		} = this.state;


		return (
			<Paper className={classes.root}>
				<Title back={base} label="ارسال تیکت" />
				<FormValidation onSubmit={this.handleSubmit}>
					<TextField
						className={classes.halfWidth}
						type="text"
						name="subject"
						margin="normal"
						label="عنوان تیکت"
						helperText='عنوان کوتاه است'
						required
						autoFocus
						inputProps={{
							minLength: 3
						}}
					/>
					<TextField
						className={classes.halfWidth}
						select
						name="department"
						margin="normal"
						label="مربوط به حوزه"
						onChange={this.handleChange('selectedType')}
						value={selectedType}>
						{
							types && types.map(obj => (
								<MenuItem key={obj.value} value={obj.value}>{obj.label}</MenuItem>
							))
						}
					</TextField>
					<TextField
						type="text"
						name="content"
						label="متن پیام"
						helperText='متن پیام کوتاه است'
						fullWidth
						required
						multiline
						rows={3}
						inputProps={{
							minLength: 5
						}}
					/>
					<div className={classes.btnContainer}>
						<Button
							className={classes.btn}
							disabled={sendLoading}
							color='primary'
							type="submit">
							ارسال
							<Loading show={sendLoading} />
						</Button>
					</div>
				</FormValidation>
			</Paper>
		);
	}
}

export default withStyles(styles)(NewTicket);
