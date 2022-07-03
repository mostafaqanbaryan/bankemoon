import API from 'api';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import LogoLoading from 'components/loading/logo';

// Elements
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Title from 'components/title';
import EmptyList from 'components/emptyList';
import AddButton from 'components/addbutton';
import ErrorBoundary from 'components/errorBoundary';

// Icon
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

const styles = theme => ({
	paper: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	row: {
		cursor: 'pointer',
		display: 'flex',
		flexDirection: 'row',
	},
	container: {
		height: 52,
		paddingRight: theme.spacing.unit*3,
		paddingLeft: theme.spacing.unit*3,
		alignItems: 'center',
		marginLeft: 48,
	},
	iconButton: {
		height: 48,
		width: 48,
	},
	overflowText: {
		textOverflow: 'ellipsis',
		overflow: 'hidden',
		whiteSpace: 'nowrap', 
		paddingLeft: 48,
	},
})

class MyTickets extends Component{
	state = {
		tickets: null,
		base: '/tickets',
		error: null,
	}

	handleError = err => this.setState({ error: err.message });

	getTickets = userId => {
		const key = 'tickets';
		const url = `/users/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({
					tickets: result.data.tickets,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	handleClick = ticketId => e => {
		// if(e.target.tagName.toLowerCase() !== 'div') return true;
		this.props.history.push(`${this.state.base}/${ticketId}/`);
	}

	reload = () => {
		const userId = this.props.getUserId();
		this.getTickets(userId);
	};

	componentDidMount = () => {
		this.API = new API();
		this.reload();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
			types,
		} = this.props;

		const {
			tickets,
			base,
			error
		} = this.state;


		return(
			<ErrorBoundary error={error} reload={this.reload}>
				{tickets
					? <div>
							<Paper>
								<Title
									padding
									label='تیکت‌های پشتیبانی' 
									button={ <AddButton to={`${base}/new/`} title='تیکت جدید' /> }
								/>
							</Paper>

							<EmptyList data={tickets}>
								{tickets.map(ticket => {
									const type = types.status[ticket.status];
									return(
										<Paper className={classes.row} onClick={this.handleClick(ticket.id)} key={ticket.id}>
											<Grid container className={classes.container} spacing={0}>
												<Grid item xs={12} sm={8}>
													<Typography className={classes.textOverflow}>
														{ticket.subject}
													</Typography>
												</Grid>
												<Hidden xsDown>
													<Grid item sm={4}>
														<Typography className={classes.textOverflow} style={{color: type.color}}>
															{type.value}
														</Typography>
													</Grid>
												</Hidden>
											</Grid>
											<IconButton className={classes.iconButton}>
												<ChevronLeftIcon />
											</IconButton>
										</Paper>
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
