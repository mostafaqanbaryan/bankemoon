import API from 'api';
import React from 'react';
import { Link } from 'react-router-dom';
import utils from 'utils';
import swal from 'sweetalert';
import { withStyles } from '@material-ui/core/styles';
import LogoLoading from 'components/loading/logo';

// Elements
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import Title from 'components/title';
import Loading from 'components/loading/button';
import EmptyList from 'components/emptyList';
import HtmlParser from 'components/htmlParser';
import ErrorBoundary from 'components/errorBoundary';
// import Square from 'components/square';

// Icon
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = theme => ({
	expansionRoot: {
		left: theme.spacing.unit,
		right: 'auto',
	},
	gridContainer: {
		alignItems: 'center',
		paddingRight: '0!important',
	},
	paperLoading: {
		position: 'relative',
		height: 49
	},
	overflowText: {
		textOverflow: 'ellipsis',
		overflow: 'hidden',
		whiteSpace: 'nowrap', 
		paddingLeft: 32,
	},
	iconLoading: {
		position: 'absolute',
		left: theme.spacing.unit,
	},
	sender: {
		marginRight: theme.spacing.unit,
		color: theme.colors.primary(1)
	},
	loading: {
		margin: '0 auto',
	},
	content: {
		whiteSpace: 'pre-wrap',
	},
	expansionContent: {
		width: '100%',
	}
});

class MyTickets extends React.Component{
	state = {
		contacts: [],
		error: null,
		deleteLoading: []
	};

	handleDelete = messageId => e => {
		swal({
			text: 'آیا  از  حذف پیام اطمینان دارید؟',
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
					this.setState( prev => ({ deleteLoading: prev.deleteLoading.concat(messageId) }));
					const key = 'contacts';
					const url = `/admin/${key}/${messageId}`;
					const cb = {
						error: result => this.setState({ error: result.message }),
						succeed: result => {
							let contacts = this.state.contacts.filter(message => message.id !== messageId);
							this.setState({
								contacts,
								error: null,
							});
						}
					};
					API.Result(cb, this.API.delete({ url, key }));
				}
			});
	};

	handleError = messageId => result => {
		this.setState(prev => ({
			error: result.message,
			deleteLoading: prev.deleteLoading.filter(l => l !== messageId)
		}));
	};

	handleRead = messageId => (e, isExpanded) => {
		if(!isExpanded)
			return false;

		const key = 'contacts';
		const url = `/admin/${key}/${messageId}`;
		let contact = this.state.contacts.filter(contact => contact.id === messageId)[0];
		if(contact.content)
			return true;
		const cb = {
			error: this.handleError(messageId),
			succeed: result => {
				contact = Object.assign(contact, result.data.contact);
				contact.status = 'Readed';
				const contacts = this.state.contacts.map(c => {
					if(c.id === messageId)
						return contact;
					return c;
				});
				this.setState({
					contacts,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleGetError = result => this.setState({ error: result.message });

	getContacts = () => {
		const key = 'contacts';
		const url = `/admin/${key}/`;
		const cb = {
			error: this.handleGetError,
			succeed: result => {
				this.setState({
					contacts: result.data.contacts,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	componentDidMount = () => {
		this.API = new API();
		this.getContacts();
	}

	render(){
		const {
			classes,
			types
		} = this.props;

		const {
			contacts,
			error,
			deleteLoading,
		} = this.state;

		return(
			<ErrorBoundary reload={this.getContacts} error={error}>
				<div>
					<Paper>
						<Title padding label='پیام‌های ارتباط با ما' />
					</Paper>

					<EmptyList data={contacts}>
						{contacts.map(message => {
							const status = types[message.status];
							return (
								<ExpansionPanel
									onChange={this.handleRead(message.id)}
									key={message.id}>
									<ExpansionPanelSummary
										classes={{expandIcon: classes.expansionRoot, content: classes.expansionContent}}
										expandIcon={<ExpandMoreIcon />}>
										<Grid container className={classes.gridContainer}>
											<Grid item xs={12} sm={8} md={5}>
												<Typography className={classes.overflowText}>
													{message.subject}
												</Typography>
												<Typography variant='caption' style={{fontSize: '0.6rem', marginTop: 4}}>
													توسط {message.fullname}
												</Typography>
											</Grid>
											<Hidden smDown>
												<Grid item xs={12} sm={3} md={3}>
													<Typography>
														{message.phone}
													</Typography>
													<Typography>
														{message.email}
													</Typography>
												</Grid>
											</Hidden>
											<Hidden xsDown>
												<Grid item xs={12} sm={2} md={2}>
													<Typography variant='caption' color='textSecondary'>
														{utils.Miladi2Shamsi(message.created_at, 'jYYYY/jMM/jDD')}
													</Typography>
												</Grid>
											</Hidden>
											<Hidden xsDown>
												<Grid item xs={12} sm={2} md={2}>
													<Typography style={{color: status.color}} variant='caption' color='textSecondary'>
														{status.value}
													</Typography>
												</Grid>
											</Hidden>
										</Grid>
									</ExpansionPanelSummary>
									<ExpansionPanelDetails className={classes.content}>
										{message.content
											? <HtmlParser>{message.content}</HtmlParser>
											: <Loading
													className={classes.loading}
													height={64}
													width={64}
													color='#eee'
													show
													/>
										}
									</ExpansionPanelDetails>
									<ExpansionPanelActions>
										<Button
											color='secondary'
											disabled={deleteLoading.includes(message.id)}
											onClick={this.handleDelete(message.id)}>
											حذف پیام
											<Loading show={deleteLoading.includes(message.id)} />
										</Button>
									</ExpansionPanelActions>
								</ExpansionPanel>
							);
						})}
					</EmptyList>
				</div>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(MyTickets);
