import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import swal from 'sweetalert';

// Elements
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Title from 'components/title';
import ErrorBoundary from 'components/errorBoundary';
import Ready from './ready';
import Placeholder from './placeholder';

// Icons
import Red from '@material-ui/core/colors/red';

const styles = theme => ({
	tableRow: {
		position: 'relative',
		height: '96px',
	},
	relative: {
		position: 'relative'
	},
	cancel: {
		color: Red['A700']
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

const columnData = [
	{ id: 'created_at', hidden: 'sm', numeric: false, label: 'تاریخ ایجاد' },
	{ id: 'updated_at', hidden: 'xs', numeric: false, label: 'آخرین بازدید' },
	{ id: 'user-agent', numeric: false, disablePadding: true, label: 'عامل' },
	{ id: 'ip', hidden: 'md', numeric: false, label: 'آدرس IP' },
	{ id: 'action', noLabel: true, numeric: false, disablePadding: true, label: '' },
];

class Session extends React.Component{
	state = {
		sessions: null,
		deletedSessions: [],
		error: null,
	};

	handleError = err => this.setState({ error: err.message });

	handleDeleteError = err => {
		swal({
			title: 'خطا',
			text: err.message,
			icon: 'error',
			button: {
				text: 'باشه',
			}
		});
	};

	getSessions = () => {
		const key = 'sessions';
		const url = `/sessions`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					sessions: result.data.sessions,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	deleteSession = sessionId => {
		const deletedSessions = this.state.deletedSessions;
		const sessions = this.state.sessions.filter((s, i) => {
			if(s.id !== sessionId)
				return s;
			deletedSessions.push({ pos: i, session: s });
			return false;
		});
		this.setState({ sessions, deletedSessions });
	};

	deleteSessionRollback = sessionId => {
		let sessions = this.state.sessions;
		const deletedSessions = this.state.deletedSessions.filter(row => {
			if(row.session.id !== sessionId)
				return row;
			sessions.splice(row.pos, 0, row.session);
			return false;
		});
		this.setState({ sessions, deletedSessions });
	};

	handleDeleteSession = sessionId => e => {
		swal({
			text: 'از قطع دسترسی این دستگاه اطمینان دارید؟',
			icon: 'warning',
			dangerMode: true,
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
				this.deleteSession(sessionId);
				const key = 'deleteSession';
				const url = `/sessions/${sessionId}`;
				const cb = {
					error: err => {
						this.deleteSessionRollback(sessionId);
						this.handleDeleteError(err);
					},
					succeed: result => { }
				};
				API.Result(cb, this.API.delete({ url, key }));
			}
		});
	};

	componentDidMount = () => {
		this.API = new API();
		this.getSessions();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			sessions,
			error
		} = this.state;

		const {
			classes,
		} = this.props;

		return(
			<ErrorBoundary error={error} reload={this.getSessions}>
				<Paper>
					<Title padding help="/tutorial/" label="دستگاه‌های متصل" />
					<Table>
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
											padding={column.disablePadding ? 'checkbox' : 'default'}>
											{column.label}
										</TableCell>
									);
								})}
							</TableRow>
						</TableHead>

						{sessions
							? <Ready
									sessions={sessions}
									handleDeleteSession={this.handleDeleteSession}
								/>
							: <Placeholder />
						}
					</Table>
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(Session);
