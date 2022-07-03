import API from 'api';
import React from 'react';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';

// Elements
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import Title from 'components/title';
import ErrorBoundary from 'components/errorBoundary';
import FormValidation from 'components/formvalidation';

import Green from '@material-ui/core/colors/green';
import Red from '@material-ui/core/colors/red';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit * 3,
	},
	tickets: {
		borderRadius: 5,
		border:  '1px solid #ddd',
	},
	row: {
		cursor: 'pointer',
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
	message: {
		border: '1px solid #ddd',
		marginTop: theme.spacing.unit*2,
		padding: theme.spacing.unit
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
		tickets: [],
		selectedTicket: null,
		isDetailsOpen: false,
		loadingDeleteBank: false,
		searchType: 'id',
		rowsPerPage: 50,
		total: 0,
	}

	handleChange = name => e => this.setState({ [name]: e.target.value }); 

	handleError = err => this.setState({ error: err.message });

	getTickets = () => {
		const key = 'tickets';
		const url = `/admin/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				tickets: result.data.tickets,
				total: result.data.total,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	getTicketMessages = ticketId => {
		this.setState({ loadingDeleteBank: true });
		const key = 'tickets';
		const url = `/admin/${key}/${ticketId}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				const ticket = this.state.selectedTicket;
				ticket.messages = result.data.ticket.messages;
				this.setState({
					selectedTicket: ticket
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleReplyTicket = e => {
		const ticket = this.state.selectedTicket;
		const formData = new FormData(e.currentTarget);
		const key = 'tickets';
		const url = `/admin/${key}/${ticket.id}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.handleCloseDetails();
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	}

	handleDeleteTicket = e => {
		const ticket = this.state.selectedTicket;
		swal({
			text: `از حذف تیکت اطمینان دارید؟`,
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
				const key = 'tickets';
				const url = `/admin/${key}/${ticket.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						const tickets = this.state.tickets.filter(t => t.id !== ticket.id);
						this.setState({
							tickets
						});
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	handleDeleteMessage = messageId => e => {
		const ticket = this.state.selectedTicket;
		swal({
			text: `از حذف پیام اطمینان دارید؟`,
			icon: 'warning',
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
				const key = 'tickets';
				const url = `/admin/${key}/${ticket.id}/messages/${messageId}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						ticket.messages = ticket.messages.filter(m => m.id !== messageId);
						this.setState({
							selectedTicket: ticket,
						});
					}
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	}

	handleCloseTicket = e => {
		const ticket = this.state.selectedTicket;
		swal({
			text: `از بستن تیکت اطمینان دارید؟`,
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
				const key = 'tickets';
				const url = `/admin/${key}/${ticket.id}`;
				const cb = {
					error: this.handleError,
					succeed: result => {
						const tickets = this.state.tickets.filter(t => t !== ticket.id);
						this.setState({ tickets });
						this.handleCloseDetails();
					}
				};
				API.Result(cb, this.API.patch({ url, key }));
			}
		});
	}

	handleShowDetails = ticketId => e => {
		const selectedTicket = JSON.parse(JSON.stringify(this.state.tickets.filter(ticket => ticket.id === ticketId)[0]));
		selectedTicket.messages = [];
		this.setState({
			isDetailsOpen: true,
			selectedTicket,
		});
		this.getTicketMessages(ticketId);
	}

	handleCloseDetails = () => {
		this.setState({
			selectedTicket: null,
			isDetailsOpen: false,
		});
	}

	componentDidMount = () => {
		this.API = new API();
		this.getTickets();
	}

	componentWillUnmount = () => {
		this.API.cancel();
	}

	render(){
		const {
			error,
			tickets,
			selectedTicket,
			isDetailsOpen,
		} = this.state;

		const {
			classes,
			types
		} = this.props;

		return(
			<ErrorBoundary error={error} reload={this.getTickets}>
				<Paper className={classes.root}>
					<header>
						<Title
							label="تیکت‌ها"
						/>
					</header>
					<section className={classes.tickets}>
						{tickets.map(ticket => {
							const status = types[ticket.status];
							return (
								<Grid className={classes.row} onClick={this.handleShowDetails(ticket.id)} container key={ticket.id}>
									<Grid item sm={2}>
										<Typography>{utils.Miladi2Shamsi(ticket.updated_at, 'jYYYY/jMM/jDD')}</Typography>
									</Grid>
									<Grid item sm={3}>
										<Typography>{ticket.subject}</Typography>
									</Grid>
									<Grid item sm={2}>
										<Typography variant='caption'>{ticket.department}</Typography>
									</Grid>
									<Grid item sm={3}>
										<Typography variant='caption'>{ticket.full_name}</Typography>
									</Grid>
									<Grid item sm={2}>
										<Typography style={{ color: status.color }}>{status.value}</Typography>
									</Grid>
								</Grid>
							);
						})}
					</section>
					<Modal
						fullScreen={true}
						open={isDetailsOpen}
						onClose={this.handleCloseDetails}>
						{selectedTicket && 
							<FormValidation onSubmit={this.handleReplyTicket} className={classes.modal}>
									<Typography>
										شماره تیکت: {selectedTicket.id}
									</Typography>
									<TextField
										name='content'
										label='متن تیکت'
										margin='dense'
										multiline
										rows={3}
										fullWidth
									/>
									<Button
										fullWidth
										type='submit'
										color='primary'>
										ارسال تیکت
									</Button>
								<Button
									fullWidth
									color="default"
									onClick={this.handleCloseTicket}>
									بستن تیکت
								</Button>
								<Button
									fullWidth
									color="default"
									onClick={this.handleDeleteTicket}>
									حذف تیکت
								</Button>
								{selectedTicket.messages.map(message => (
									<div className={classes.message}>
										<Typography variant='caption'>
											{message.admin_full_name ? message.admin_full_name : selectedTicket.full_name}
										</Typography>
										<Typography>{message.content}</Typography>
										<Button
											onClick={this.handleDeleteMessage(message.id)}
											color='secondary'>
											حذف پیام
										</Button>
									</div>))
								}
								</FormValidation>
						}
					</Modal>
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(AdminBanks);


