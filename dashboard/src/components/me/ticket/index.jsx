import API from 'api';
import React, { Component } from 'react';
import utils from 'utils';
import classNames from 'classnames';
import swal from 'sweetalert';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Title from 'components/title';
import Square from 'components/square';
import Loading from 'components/loading/button';
import FormValidation from 'components/formvalidation';

import Green from '@material-ui/core/colors/green';
import Blue from '@material-ui/core/colors/blue';

const styles = theme => ({
	header: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	action: {
		marginTop: theme.spacing.unit*3,
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	actionCard: {
		justifyContent: 'flex-end',
		[theme.breakpoints.down('xs')]: {
			'& > button': {
				width: '100%',
			}
		}
	},
	responseContent: {
		whiteSpace: 'pre-line',
	},
	content: {
		background: 'transparent',
		boxShadow: 'none',
		'&:after': {
			content: '""',
			clear: 'both',
			display: 'block'
		}
	},
	contentHeader: {
		marginBottom: theme.spacing.unit,
		'&:after': {
			content: '""',
			clear: 'both',
			display: 'block'
		},
	},
	contentHeaderLeft: {
		float: 'left',
		direction: 'ltr',
		[theme.breakpoints.down('xs')]: {
			float: 'none!important',
		}
	},
	contentHeaderRight: {
		float: 'right',
	},
	card: {
		position: 'relative',
		width: '80%',
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
		marginBottom: theme.spacing.unit,
		marginTop: theme.spacing.unit*2,
		// borderRadius: theme.spacing.unit,
		overflow: 'hidden',
	},
	cardQuestion: {
		background: Blue[200],
		float: 'right',
	},
	cardAnswer: {
		background: Green[200],
		float: 'left',
	},
	cardLoading: {
		background: '#fff!important',
	},
	marginTop: {
		marginTop: 2,
	}
});

class MyTicket extends Component{
	state = {
		base: '/tickets/',
		ticket: null,
		error: null,
		responses: [],
		sendLoading: false
	};

	handleRedirect = result => this.props.history.replace('/not-found');
	handleError = result => {
		let message = result.code === 404 ? 'تیکت بسته شده است' : result.message;
		this.setState({
			// error: message,
			closeLoading: false,
			sendLoading: false,
		});
		swal({
			title: 'خطا',
			text: message,
			icon: 'error',
			buttons: {
				confirm: {
					value: true,
					text: 'باشه',
				},
			}
		});
	};

	getTicket = ticketId => {
		const key = 'tickets';
		const url = `/users/${key}/${ticketId}`;
		const cb = {
			error: this.handleRedirect,
			succeed: (result => {
				this.setState({
					ticket: result.data.ticket,
					responses: result.data.responses,
					error: null,
				});
				this.props.getBadges();
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	replyTicket = e => {
		this.setState({ sendLoading: true });
		const ticketId = this.state.ticketId;
		const key = 'tickets';
		const url = `/users/${key}/${ticketId}`;
		const formData = new FormData(e.target);
		const cb = {
			error: this.handleError,
			succeed: (result => {
				let created_at = result.data.response.created_at;
				let responses = this.state.responses;
				if(this.content)
					this.content.value = '';
				responses.push({
					created_at,
					content: formData.get('content'),
				});
				this.setState({
					responses,
					error: null,
					sendLoading: false,
				});
			})
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	closeTicket = e => {
		swal({
			text: 'جواب خود را گرفته و از بستن تیکت اطمینان دارید؟',
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
			.then(value => {
				if(value){
					this.setState({ closeLoading: true });
					const ticketId = this.state.ticketId;
					const key = 'tickets';
					const url = `/users/${key}/${ticketId}`;
					const formData = new FormData(e.target);
					const cb = {
						error: this.handleError,
						succeed: (result => {
							this.setState({
								responses: [],
								error: null,
								closeLoading: false,
							});
							this.props.history.replace(this.state.base);
						})
					};
					API.Result(cb, this.API.patch({ url, key, formData }));
				}
			});
	};

	componentDidMount = () => {
		this.API = new API();
		const ticketId = this.props.match.params.ticketId;
		this.setState({ ticketId });
		this.getTicket(ticketId);
	};

	render(){
		const {
			classes,
			types,
		} = this.props;

		const {
			ticket,
			responses,
			sendLoading,
			closeLoading,
			base,
		} = this.state;


		if(ticket)
			return(
				<div>
					<Paper className={classes.header}>
						<Title
							label={ticket.subject}
							subheader={'حوزه ' + types.department[ticket.department]}
							back={base} />
					</Paper>

					<Paper className={classes.content}>
						{responses.map(response => (
							<Card className={classNames(classes.card, response.role ? classes.cardAnswer : classes.cardQuestion)} key={response.created_at}>
								<CardContent>
									<header className={classes.contentHeader}>
										<div className={classes.contentHeaderRight}>
											<Typography variant='body1' color='textSecondary'>
												{response.role ? response.full_name : ticket.full_name}
											</Typography>
											<Typography gutterBottom variant='caption'>
												{response.role ? types.user[response.role] : types.user['User']}
											</Typography>
										</div>
										<div className={classes.contentHeaderLeft}>
											<Typography color='textSecondary'>
												{utils.Miladi2Shamsi(response.created_at, 'jYYYY/jMM/jDD')}
											</Typography>
										</div>
									</header>
									<Typography className={classes.responseContent} variant='body1'>
										{response.content}
									</Typography>
								</CardContent>
							</Card>
						))}
					</Paper>

					{ticket.status !== 'Closed' &&
						<Card className={classes.action}>
							<FormValidation onSubmit={this.replyTicket}>
								<TextField
									multiline
									fullWidth
									rows='5'
									rowsMax='5'
									type='text'
									label='متن پیام'
									name='content'
									inputRef={ref => this.content=ref}
									required
									helperText='متن پیام کوتاه است'
									inputProps={{
										minLength: 10,
									}}
								/>
								<CardActions className={classes.actionCard}>
									<Button
										disabled={sendLoading}
										type='submit'
										color='primary'>
										ارسال پیام
										<Loading show={sendLoading} />
									</Button>
									<Button
										disabled={closeLoading}
										type='button'
										onClick={this.closeTicket}
										color='secondary'>
										بستن تیکت
										<Loading show={closeLoading} />
									</Button>
								</CardActions>
							</FormValidation>
						</Card>
					}
				</div>
			);
		else
			return(
				<div>
					<Paper className={classes.header}>
						<Title label='درحال دریافت اطلاعات...' back={base} />
					</Paper>

					{[...Array(4)].map((zero, i) => (
							<Card className={classNames(classes.card, classes.cardLoading, i%2 === 0 ? classes.cardQuestion : classes.cardAnswer)} key={i}>
								<CardContent>
									<header className={classes.contentHeader}>
										<div className={classes.contentHeaderRight}>
											<Square height={20} width={150} />
											<Square height={16} width={50} className={classes.marginTop} />
										</div>
										<div className={classes.contentHeaderLeft}>
											<Square height={20} width={100} />
										</div>
									</header>
									<Square className={classes.marginTop} height={20} width='90%' />
									<Square className={classes.marginTop} height={20} width='50%' />
									<Square className={classes.marginTop} height={20} width='70%' />
									<Square className={classes.marginTop} height={20} width='40%' />
								</CardContent>
							</Card>
					))}
				</div>
			);
	}
}

export default withStyles(styles)(MyTicket);

