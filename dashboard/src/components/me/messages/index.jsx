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
		messages: null,
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
					const key = 'messages';
					const url = `/users/${key}/${messageId}`;
					const cb = {
						error: result => this.setState({ error: result.message }),
						succeed: result => {
							let messages = this.state.messages.filter(message => message.id !== messageId);
							this.setState({
								messages,
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

		const key = 'messages';
		const url = `/users/${key}/${messageId}`;
		let message = this.state.messages.filter(message => message.id === messageId)[0];
		if(message.content)
			return true;
		const cb = {
			error: this.handleError(messageId),
			succeed: result => {
				message = Object.assign(message, result.data.message);
				message.status = 'Readed';
				const messages = this.state.messages.map(m => {
					if(m.id === messageId)
						return message;
					return m;
				});
				this.setState({
					messages,
					error: null,
				});
				this.props.getBadges();
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleGetError = result => this.setState({ error: result.message });

	getMessages = userId => {
		const key = 'messages';
		const url = `/users/${key}/`;
		const cb = {
			error: this.handleGetError,
			succeed: result => {
				this.setState({
					messages: result.data.messages,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	componentDidMount = () => {
		this.API = new API();
		const userId = this.props.getUserId();
		this.getMessages(userId);
	}

	render(){
		const {
			classes,
			types
		} = this.props;

		const {
			messages,
			error,
			deleteLoading,
		} = this.state;

		return(
			<ErrorBoundary reload={this.getMessages} error={error}>
				{messages
					? <div>
							<Paper>
								<Title padding label='پیام‌های من' />
							</Paper>

							<EmptyList data={messages}>
								{messages.map(message => {
									const status = types.status[message.status];
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
															توسط {message.sender_full_name}
														</Typography>
													</Grid>
													<Hidden smDown>
														<Grid item xs={12} sm={3} md={3}>
															<Typography>
																از طرف بانک
																<Button
																	component={Link}
																	className={classes.sender}
																	to={`/@${message.bank_username}/`}>
																	{message.bank_name}
																</Button>
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
					: <LogoLoading center />
				}
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(MyTickets);
