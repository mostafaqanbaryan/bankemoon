import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';

import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import CardContent from '@material-ui/core/CardContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import Title from 'components/title';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';
import UserAutoSuggest from 'components/bank/userAutoSuggest';

const styles = theme => ({
	root: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	chip: {
		marginLeft: theme.spacing.unit * 2,
		marginBottom: theme.spacing.unit,
	},
	toAllUsers: {
		float: 'left',
		marginLeft: theme.spacing.unit,
	},
	btnSubmit: {
		float: 'left',
		marginTop: theme.spacing.unit,
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			width: '100%',
		}
	}
});

class Message extends React.Component{
	state = {
		toAllUsers: false,
		sendLoading: false,
	};

	handleChangeSelectAll = e => {
		this.props.clearSelectedUsers();
		this.setState(prev => ({ toAllUsers: !prev.toAllUsers }));
	};

	handleError = err => {
		this.setState({ sendLoading: false });
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			buttons: {
				confirm: {
					text: 'باشه',
				}
			}
		});
	};

	handleSendMessage = e => {
		this.setState({ sendLoading: true });
		const formData = new FormData(e.target);
		const users = this.props.getUsers();
		delete users.all;
		const userIds = Object.keys(users).map(u => parseInt(u, 10));
		formData.set('toAllUsers', this.state.toAllUsers);
		formData.set('ids', JSON.stringify(userIds));

		const bankUsername = this.props.match.params.bankUsername;
		const key = 'message';
		const url = `/banks/${bankUsername}/${key}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({ sendLoading: false });
				this.props.handleOpenSnack({
					message: 'پیام با موفقیت ارسال شد',
					variant: 'success',
				});
			})
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentDidMount = () => {
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel()
	};

	render(){
		const {
			toAllUsers,
			sendLoading,
		} = this.state;
		const {
			classes,
		} = this.props;

		const bankUsername = this.props.match.params.bankUsername;
		const users = this.props.getUsers();
		const userIds = Object.keys(users).map(u => parseInt(u, 10));
		const base = `/@${bankUsername}`;
		return(
			<Paper className={classes.root}>
				<Title label='ارسال پیام برای اعضا' help='/tutorial/bank/message/' back={`${base}/`} />
				<Card elevation={0}>
					<CardContent>
						{userIds.map(uid => (
							<Chip
								key={uid}
								label={users[uid].fn}
								onDelete={this.props.removeSelectedUser(uid, users[uid].p)}
								className={classes.chip}
							/>
						))}
						<UserAutoSuggest
							disabled={toAllUsers}
							exclude={userIds}
							bankUsername={bankUsername}
							onClick={this.props.addSelectedUser} />
						<FormControlLabel
							label='ارسال پیام به تمامی اعضا'
							className={classes.toAllUsers}
							control={
								<Switch
									checked={toAllUsers}
									onChange={this.handleChangeSelectAll}
								/>
							}
						/>

						<FormValidation onSubmit={this.handleSendMessage}>
							<TextField
								name='subject'
								margin='normal'
								autoFocus
								fullWidth
								required
								type='text'
								label='عنوان پیام'
								helperText='عنوان پیام کوتاه است'
								inputProps={{
									minLength: 3
								}}
							/>
							<TextField
								name='content'
								margin='normal'
								multiline
								fullWidth
								required
								rows='5'
								rowsMax='5'
								type='text'
								label='متن پیام'
								helperText='متن پیام کوتاه است'
								inputProps={{
									minLength: 10
								}}
							/>
							<Button
								disabled={sendLoading}
								className={classes.btnSubmit}
								color='primary'
								type='submit'>
								ارسال پیام
								<Loading show={sendLoading} />
							</Button>
						</FormValidation>
					</CardContent>
				</Card>
			</Paper>
		);
	}
}

export default withStyles(styles)(Message);
