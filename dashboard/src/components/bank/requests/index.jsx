import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';
import classNames from 'classnames';

// Elements
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import Paper from '@material-ui/core/Paper';

import Title from 'components/title';
import EmptyList from 'components/emptyList';
import LogoLoading from 'components/loading/logo';
import ErrorBoundary from 'components/errorBoundary';

// Icons
import DeleteIcon from '@material-ui/icons/Clear';
import AcceptIcon from '@material-ui/icons/Done';
import MessageIcon from '@material-ui/icons/Message';

// Colors
import Green from '@material-ui/core/colors/green';

const styles = theme => ({
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
	rootCellDate: {
		paddingRight: 0,
	},
	fullName: {
		fontSize: '1rem',
		fontWeight: 400,
		[theme.breakpoints.down('xs')]: {
			fontSize: '0.9rem',
		}
	},
	request: {
		height: '38px',
		width: '38px',
		background: Green.A700,
		'&:hover': {
			background: Green.A400
		}
	},
	tableRow: {
		height: '96px',
	},
	accept: {
		color: Green[500],
		'&:hover': {
			color: Green[500]
		}
	},
	textCenter: {
		textAlign: 'center',
	},
	instalment: {
		fontWeight: 500,
	}
});

const columnData = [
	{ id: 'name', numeric: false, disablePadding: true, label: 'نام و نام خانوادگی' },
	{ id: 'phone', hidden: 'xs', numeric: true, disablePadding: true, label: 'شماره تماس' },
	{ id: 'email', hidden: 'sm', numeric: true, disablePadding: false, label: 'ایمیل' },
	{ id: 'action', numeric: false, disablePadding: false, label: '' },
];

class Requests extends React.Component{
	state = {
		error: null,
		requests: null,
		page: 1,
		rowsPerPage: 15,
	};

	handleReqError = err => {
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: 'باشه',
			className: this.props.classes.swal,
		});
	};

	rollback = (request, index) => {
		const requests = this.state.requests;
		requests.splice(index, 0, request);
		this.setState({ requests });
		let badge = this.props.bankBadges.requests + 1;
		this.props.updateBankBadges('requests', badge);
	};

	onModify = requestId => {
		let index = 0;
		const requests = this.state.requests.filter((r, i) => {
			if(r.id !== requestId)
				return r;
			index = i;
			return false;
		});
		this.setState({ requests });
		let badge = this.props.bankBadges.requests - 1;
		this.props.updateBankBadges('requests', badge);
		return index;
	};

	handleAccept = requestId => {
		let request = this.state.requests.filter(r => r.id === requestId)[0];
		swal({
			text: `از ایجاد حساب برای ${request.full_name} اطمینان دارید؟`,
			icon: 'warning',
			buttons: {
				cancel: {
					visible: true,
					text: 'نه',
					value: null,
				},
				confirm: {
					text: 'آره',
					value: true,
				}
			},
		}).then(value => {
			if(value){
				const index = this.onModify(requestId);
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'clients';
				const url = `/banks/${bankUsername}/${key}/${requestId}/`;
				const cb = {
					error: err => {
						this.rollback(request, index);
						this.handleReqError(err);
					},
					succeed: (result => {})
				};
				API.Result(cb, this.API.post({ url, key }));
			}
		});
	};

	handleDecline = requestId => {
		let request = this.state.requests.filter(r => r.id === requestId)[0];
		swal({
			text: `از رد درخواست عضویت ${request.full_name} اطمینان دارید؟`,
			icon: 'warning',
			dangerMode: true,
			buttons: {
				cancel: {
					visible: true,
					text: 'نه',
					value: null,
				},
				confirm: {
					text: 'آره',
					value: true,
				}
			},
		}).then(value => {
			if(value){
				const index = this.onModify(requestId);
				const bankUsername = this.props.match.params.bankUsername;
				const key = 'clients';
				const url = `/banks/${bankUsername}/${key}/${requestId}/`;
				const cb = {
					error: err => {
						this.rollback(request, index);
						this.handleReqError(err);
					},
					succeed: (result => {})
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	handleSendMessage = request => e => {
		const bankUsername = this.props.match.params.bankUsername;
		const url = `/@${bankUsername}/admin/message/`;
		this.props.setSelectedUsers({
			[request.id]: {
				fn: request.full_name,
			}
		});
		this.props.history.push(url);
	};

	handleGetError = err => this.setState({ error: err.message });
	getRequests = bankUsername => {
		const key = 'pending';
		const url = `/banks/${bankUsername}/clients/${key}`;
		const cb = {
			error: this.handleGetError,
			succeed: (result => {
				this.setState({
					requests: result.data.users,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	componentDidMount = () => {
		this.API = new API();
		const bankUsername = this.props.match.params.bankUsername;
		this.getRequests(bankUsername);
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
		} = this.props;
		const {
			error,
			requests,
		} = this.state;
		const bankUsername = this.props.match.params.bankUsername;
		const base = `/@${bankUsername}`;

		return(
			<ErrorBoundary reload={this.getRequests.bind(this, bankUsername)} error={error}>
				{requests
					? <Paper>
							<Title label='لیست درخواست‌ها' back={`${base}/`} help='/tutorial/' padding />
							{requests.length > 0
								? <Table>
										<TableHead>
											<TableRow>
												{columnData.map(column => {
													let className = [];
													className.push(column.center ? classes.textCenter : null);
													switch(column.hidden){
														case 'xs':
															className.push(classes.hiddenXs);
															break;
														case 'sm':
															className.push(classes.hiddenSm);
															break;
														case 'md':
															className.push(classes.hiddenMd);
															break;
														case 'lg':
															className.push(classes.hiddenLg);
															break;
														case 'xl':
															className.push(classes.hiddenXl);
															break;
														default:
															break;
													}
													return(
														<TableCell
															key={column.id}
															className={classNames(className)}
															numeric={column.numeric}
															padding={column.disablePadding ? 'checkbox' : 'default'}
														>
															{!column.noLabel &&
																	column.label
															}
														</TableCell>
													);
												})}
											</TableRow>
										</TableHead>

										<TableBody>
											{requests.map(request => {
												return (
													<TableRow
														className={classNames(classes.tableRow)}
														hover
														role="link"
														tabIndex={-1}
														key={request.id}>
														<TableCell className={classes.fullName} padding="checkbox">
															{request.full_name}
														</TableCell>

														<TableCell className={classes.hiddenXs} padding='checkbox'>
															{request.phone}
														</TableCell>

														<TableCell className={classes.hiddenSm}>
																{request.email
																	? <Tooltip title='ارسال ایمیل'>
																			<a href={`mailto: ${request.email}`}>
																				{request.email}
																			</a>
																		</Tooltip>
																	: <Typography variant='caption'>ثبت نشده است</Typography>
																}
														</TableCell>

														<TableCell>
															<Tooltip title='پذیرفتن درخواست'>
																<IconButton
																	className={classes.accept}
																	onClick={this.handleAccept.bind(this, request.id)}>
																	<AcceptIcon />
																</IconButton>
															</Tooltip>

															<Tooltip title='رد درخواست'>
																<IconButton
																	color='secondary'
																	onClick={this.handleDecline.bind(this, request.id)}>
																	<DeleteIcon />
																</IconButton>
															</Tooltip>

															<Tooltip title='ارسال پیام'>
																<IconButton className={classes.hiddenXs} onClick={this.handleSendMessage(request)}>
																	<MessageIcon />
																</IconButton>
															</Tooltip>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								: <EmptyList data={requests} />
							}
						</Paper>
					: <LogoLoading center />
				}
			</ErrorBoundary>
		);
	}
}

Requests.propTypes = {
	/* types				 : propTypes.array.isRequired,
	handleSubmit : propTypes.func.isRequired, */
};
export default withStyles(styles)(Requests);
