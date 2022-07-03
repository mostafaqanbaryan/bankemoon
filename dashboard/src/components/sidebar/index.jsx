import React from 'react';
import propTypes from 'prop-types';
import classNames from 'classnames';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

// Elements
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Drawer from '@material-ui/core/Drawer';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from '@material-ui/core/Avatar';
import ForumIcon from '@material-ui/icons/Forum';
import MessageIcon from '@material-ui/icons/Message';
import DashboardIcon from '@material-ui/icons/Dashboard';
import LibraryBookIcon from '@material-ui/icons/LibraryBooks';
import SessionsIcon from '@material-ui/icons/Dns';
import LogoutIcon from '@material-ui/icons/PanTool';
import Red from '@material-ui/core/colors/red';

import Badge from 'components/enhancement/badge';
import Circle from 'components/circle';


const drawerOpenWidth = '300px';
const drawerCloseWidth = '60px';

const styles = theme => ({
	drawerPaper: {
		position: 'relative',
		height: '100vh',
		minHeight: window.innerHeight - 64 - 26,
		width: drawerOpenWidth,
		boxShadow: theme.shadows[4],
		overflowX: 'hidden',
		transition: theme.transitions.create('width', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
		[theme.breakpoints.down('sm')]: {
			width: window.innerWidth,
			margin: -12,
			height: 'calc(100vh - 64px)'
		}
	},
	drawerPaperClose: {
		width: drawerCloseWidth,
		transition: theme.transitions.create('width', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
	},
	drawerInner: {
		// Make the items inside not wrap when transitioning:
		width: drawerOpenWidth,
		[theme.breakpoints.down('md')]: {
			width: '100%',
		}
	},
	sidebar: {
		transition: theme.transitions.create('width', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
		[theme.breakpoints.only('xs')]: {
			// Small screen, fullwidth sidebar with scroll
			height: "calc(100% - 64px)",
			overflowY: 'auto',
			paddingBottom: '0!important',
			paddingTop: '0!important',
		},
		/* [theme.breakpoints.down('md')]: {
			// Small screen, fullwidth sidebar with scroll
			height: "calc(100% - 75px)",
			overflowY: 'auto',
		}, */
	},
	active: {
		background: '#eee',
	},
	list: {
		'&>*':{
			height: '60px',
			padding: '5px',
		}
	},
	avatar:{
		background: '#ccc',
		color: '#fff',
		lineHeight: '5.8rem',
		boxShadow: '0 0 15px #CCC',
		height: '96px',
		width: '96px',
		margin: '0 auto',
		transition: 'box-shadow 0.2s, border 0.3s',
		willChange: 'box-shadow, border',
		cursor: 'pointer',
		border: `2px solid ${theme.colors.primary(0.6)}`,
		'&:hover': {
			boxShadow: '0 0 20px #DDD',
			border: '2px solid transparent',
		},
	},
	avatarSmall: {
		color: '#000',
		fontSize: '0.7rem',
		lineHeight: '1.9rem',
		height: '32px',
		width: '32px',
		cursor: 'pointer',
		margin: '15px auto',
		boxShadow: '0 0 15px #CCC',
		'&:hover': {
			boxShadow: '0 0 15px #DDD',
		},
	},
	avatarImg: {
		borderRadius: '50%'
	},
	header: {
		position: 'relative',
		backgroundColor: theme.colors.primary(1),
		backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M81.28 88H68.413l19.298 19.298L81.28 88zm2.107 0h13.226L90 107.838 83.387 88zm15.334 0h12.866l-19.298 19.298L98.72 88zm-32.927-2.207L73.586 78h32.827l.5.5 7.294 7.293L115.414 87l-24.707 24.707-.707.707L64.586 87l1.207-1.207zm2.62.207L74 80.414 79.586 86H68.414zm16 0L90 80.414 95.586 86H84.414zm16 0L106 80.414 111.586 86h-11.172zm-8-6h11.173L98 85.586 92.414 80zM82 85.586L87.586 80H76.414L82 85.586zM17.414 0L.707 16.707 0 17.414V0h17.414zM4.28 0L0 12.838V0h4.28zm10.306 0L2.288 12.298 6.388 0h8.198zM180 17.414L162.586 0H180v17.414zM165.414 0l12.298 12.298L173.612 0h-8.198zM180 12.838L175.72 0H180v12.838zM0 163h16.413l.5.5 7.294 7.293L25.414 172l-8 8H0v-17zm0 10h6.613l-2.334 7H0v-7zm14.586 7l7-7H8.72l-2.333 7h8.2zM0 165.414L5.586 171H0v-5.586zM10.414 171L16 165.414 21.586 171H10.414zm-8-6h11.172L8 170.586 2.414 165zM180 163h-16.413l-7.794 7.793-1.207 1.207 8 8H180v-17zm-14.586 17l-7-7h12.865l2.333 7h-8.2zM180 173h-6.613l2.334 7H180v-7zm-21.586-2l5.586-5.586 5.586 5.586h-11.172zM180 165.414L174.414 171H180v-5.586zm-8 5.172l5.586-5.586h-11.172l5.586 5.586zM152.933 25.653l1.414 1.414-33.94 33.942-1.416-1.416 33.943-33.94zm1.414 127.28l-1.414 1.414-33.942-33.94 1.416-1.416 33.94 33.943zm-127.28 1.414l-1.414-1.414 33.94-33.942 1.416 1.416-33.943 33.94zm-1.414-127.28l1.414-1.414 33.942 33.94-1.416 1.416-33.94-33.943zM0 85c2.21 0 4 1.79 4 4s-1.79 4-4 4v-8zm180 0c-2.21 0-4 1.79-4 4s1.79 4 4 4v-8zM94 0c0 2.21-1.79 4-4 4s-4-1.79-4-4h8zm0 180c0-2.21-1.79-4-4-4s-4 1.79-4 4h8z' fill='%23b69f68' fill-opacity='0.7' fill-rule='evenodd'/%3E%3C/svg%3E")`,
		padding: '15px 5px 10px',
		borderRadius: '0 0 50% 50%/10%',
		textAlign: 'center',
		transition: theme.transitions.create('height', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
	},
	name: {
		color: '#EEE',
		marginTop: '15px',
		fontSize: '1rem',
		textShadow: '0 0 2px #333'
	},
	nameSmall: {
		color: '#333',
		marginTop: '10px',
		fontSize: '0.7rem',
		textAlign: 'center',
	},
	package: {
		color: '#EEE',
		marginTop: '5px',
		fontSize: '0.625rem',
		textShadow: '0 0 2px #333'
	},
	gold: {
		textShadow: '0 0 2px #FD0'
	},
	userId: {
		color: '#EEE',
		marginTop: '5px',
		fontSize: '0.850rem',
		textShadow: '0 0 2px #333'
	},
	row: {
		textAlign: 'right'
	},
});

class Sidebar extends React.Component{
	isSmall = () => window.innerWidth < 600;

	isUrl = (url, config) => {
		const pathname = this.props.location.pathname;

		if(config && config.exact) {
			return this.isUrlExact(pathname, url);
		} else {
			return this.isUrlStartsWith(pathname, url);
		}
	}
	isUrlExact = (pathname, url) => {
		for(let i = 0; i < url.length; i++){
			if(pathname === url[i])
				return true;
		}
		return false;
	}
	isUrlStartsWith = (pathname, url) => {
		for(let i = 0; i < url.length; i++){
			if(pathname.startsWith(url[i]))
				return true;
		}
		return false;
	}

	render(){
		const { classes, className, badges, open, user } = this.props;

		return (
			<aside id='sidebar' className={classNames(classes.sidebar, className)}>
				<Drawer classes={{paper: classNames(classes.drawerPaper, !open && classes.drawerPaperClose)}} variant='permanent'>
					{open && !this.isSmall()
						? <div style={{height: '200px'}} className={classNames(classes.header, classes.drawerInner)}>
								{!user
									? <Circle className={classes.avatar} diameter={96} />
									: <Tooltip placement='left' title='پروفایل'>
											<Avatar component={Link} to='/me/' classes={{
												root: classes.avatar,
												img: classes.avatarImg
												}} alt='آواتار' src={utils.avatar.user(user.avatar, user.phone)}/>
										</Tooltip>
								}

								<Typography className={classes.name}>
									{user
										? user.full_name
										: 'درحال یافتن شما...'
									}
								</Typography>

								<Typography className={classes.userId}>
									{user
										? `شماره کاربری ${user.id}`
										: ''
									}
								</Typography>

							</div>
						: <div style={{height: '90px'}} >
								{!user
									? <Circle className={classes.avatarSmall} diameter={32} />
									: <Avatar component={Link} to='/me/' classes={{
											root: classNames(classes.avatarSmall),
											img: classes.avatarImg
											}} alt='آواتار' src={utils.avatar.user(user.avatar, user.phone)} />
								}
								<Typography className={classes.nameSmall}>{user ? user.full_name : '...'}</Typography>
							</div>
					}

					<List className={classNames(classes.drawerInner, classes.list)} component='nav'>
						<ListItem button className={this.isUrl(['/'],  {exact: true}) ? classes.active : ''}  component={Link} to='/'>
							<ListItemIcon>
								<DashboardIcon />
							</ListItemIcon>
							<ListItemText className={classes.row} inset primary='نمایش تمامی بانک‌ها' />
						</ListItem>

						{this.isSmall() &&
							<ListItem button className={this.isUrl(['/sessions']) ? classes.active : ''}  component={Link} to='/sessions/'>
								<ListItemIcon>
									<SessionsIcon />
								</ListItemIcon>
								<ListItemText className={classes.row} inset primary='دستگاه‌های متصل' />
							</ListItem>
						}

						<ListItem button className={this.isUrl(['/tickets/']) ? classes.active : ''} component={Link} to='/tickets/'>
							<ListItemIcon>
								<ForumIcon />
							</ListItemIcon>
							<Badge badgeContent={badges && badges.tickets ? badges.tickets : 0} timeout={200} color='secondary'>
								<ListItemText className={classes.row} inset primary='تیکت‌های من' />
							</Badge>
						</ListItem>

						<ListItem button className={this.isUrl(['/messages/']) ? classes.active : ''}  component={Link} to='/messages/'>
							<ListItemIcon>
								<MessageIcon />
							</ListItemIcon>
							<Badge badgeContent={badges && badges.messages ? badges.messages : 0} timeout={300} color='secondary'>
								<ListItemText className={classes.row} inset primary='پیام‌های من' />
							</Badge>
						</ListItem>

						<ListItem button component={'a'} target='_blank' href='/blog/tutorials/'>
							<ListItemIcon>
								<LibraryBookIcon />
							</ListItemIcon>
							<ListItemText className={classes.row} inset primary='آموزش' />
						</ListItem>

						{this.isSmall() &&
							<ListItem button style={{ color: Red.A700 }} component={Link} to='/auth/logout/'>
								<ListItemIcon style={{ color: Red.A700 }}>
									<LogoutIcon />
								</ListItemIcon>
								<ListItemText className={classes.row} primaryTypographyProps={{ style: { color: Red.A700 } }} inset primary='خروج' />
							</ListItem>
						}
					</List>
				</Drawer>
			</aside>
		);
	}
}

Sidebar.propTypes = {
	open: propTypes.bool.isRequired,
};

export default withStyles(styles)(Sidebar);
