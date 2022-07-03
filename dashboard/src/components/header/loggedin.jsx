import React, { Component } from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
// import logo from 'logo.svg';
import Logo from 'logo';

// Elements
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import AppBar from '@material-ui/core/AppBar';
import Hidden from '@material-ui/core/Hidden';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Toolbar from '@material-ui/core/Toolbar';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';

// Icons
import MenuIcon from '@material-ui/icons/Menu';
import ProfileIcon from '@material-ui/icons/AccountCircle';
import SessionsIcon from '@material-ui/icons/Dns';
import LogoutIcon from '@material-ui/icons/PanTool';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import Badge from 'components/enhancement/badge';
import Beta from 'components/beta';

// Colors
import Red from '@material-ui/core/colors/red';

const styles = theme => ({
	container:{
		alignItems: 'center',
		[theme.breakpoints.down('xs')]:{
			paddingTop: 10,
			paddingBottom: 10,
		},
	},
	logo: {
		width: 72,
		height: 48,
	},
	accountCircle: {
		height: 32,
		width: 32,
	},
	textCenter: {
		textAlign: 'center',
		[theme.breakpoints.down('xs')]: {
			textAlign: 'right',
		}
	},
	textLeft: {
		textAlign: 'left',
	},
	phoneNumberChip: {
		textDecoration: 'none',
		cursor: 'pointer',
	},
	inline: {
		display: 'inline'
	},
	menuIcon: {
		verticalAlign: 'middle',
		opacity: 0.6,
		paddingLeft: theme.spacing.unit,
		width: 18,
		height: 18,
	},
	logout: {
		color: Red.A700
	}
});

const isSmall = () => window.innerWidth < 600;

class Header extends Component{
	state = {
		anchorEl: null,
		isSmall: isSmall(),
	}


	handleMenuOpen = e => {
		this.setState({anchorEl: e.currentTarget});
	}
	handleMenuClose = e => {
		this.setState({anchorEl: null});
	}

	handleResize = () => {
		const is = isSmall();
		if(this.state.isSmall !== is){
			this.setState({ isSmall: is });
		}
	}

	componentDidMount = () => {
		window.addEventListener('resize', this.handleResize);
	};

	componentWillUnmount = () => {
		window.removeEventListener('resize', this.handleResize);
	};

	onMenuClick = e => this.props.handleSidebarDrawer();

	render(){
		const {
			classes,
			role,
			className,
			badges,
		} = this.props;
		const { anchorEl } = this.state;
		const open = Boolean(anchorEl);
		const isNotFound = this.props.isNotFound();
		const badgesTotal = badges
			? Object.keys(badges).reduce((total, key) => { total += parseInt(badges[key], 10); return total; })
			: 0;

		return (
			<AppBar className={className} id='header' color='inherit' position='static'>
				<Toolbar>
					<Grid className={classes.container} container>
						{!this.state.isSmall &&
							<Grid item sm={5} style={{
							display: 'flex',
							flextDirection: 'row',
							alignItems: 'center',
						}}>
								<Typography variant='subheading'>
									{!isNotFound &&
										<IconButton onClick={this.onMenuClick} color='inherit' aria-label='Menu'>
											<MenuIcon />
										</IconButton>
									}
								</Typography>

								{/*<Hidden xsDown>
									بانک فامیلی و خونوادگیمون
								</Hidden>*/}
								<Beta />
							</Grid>
						}

						<Grid item xs={5} sm={2} className={classes.textCenter}>
							<ButtonBase
								aria-label='logo'
								component={'a'}
								href='/'
								focusRipple>
								<Logo color='#000' center height={48} width={66} />
							</ButtonBase>


							{this.state.isSmall && 
								<Badge badgeContent={badgesTotal} timeout={300} color='secondary'>
									<IconButton onClick={this.onMenuClick} color='inherit' aria-label='Menu'>
										<MenuIcon />
									</IconButton>
								</Badge>
							}
						</Grid>

						<Grid item xs={7} sm={5} className={classes.textLeft}>
							{role && 
								<Hidden xsDown>
									<Button
										style={{ marginLeft: 8 }}
										color='primary'
										component={Link}
										to='/admin/dashboard/'>
											پنل مدیریت
									</Button>
								</Hidden>
							}
							<Chip
								className={classes.phoneNumberChip}
								label={'پشتیبانی: ' + process.env.SMS_OWNER}
								component={'a'}
								href={'tel: ' + process.env.SMS_OWNER}
							/>
							<div className={classes.inline}>
								<Hidden xsDown>
									<IconButton
										aria-owns={open ? 'menu-useraction' : null}
										aria-haspopup
										onClick={this.handleMenuOpen}>
										<AccountCircleIcon className={classes.accountCircle} />
									</IconButton>
								</Hidden>
								<Menu
									id='menu-useraction'
									getContentAnchorEl={null}
									anchorEl={anchorEl}
									anchorOrigin={{
										vertical: 'bottom',
										horizontal: 'left'
									}}
									transformOrigin={{
										vertical: 'bottom',
										horizontal: 'right'
									}}
									open={open}
									onClose={this.handleMenuClose}
									marginThreshold={60}
									MenuListProps={{
										disablePadding: true,
									}}>
									<MenuItem onClick={this.handleMenuClose} component={Link} to='/me/'>
										<Typography>
											<ProfileIcon className={classes.menuIcon} />
											صفحه کاربری
										</Typography>
									</MenuItem>
									<MenuItem onClick={this.handleMenuClose} component={Link} to='/sessions/'>
										<Typography>
											<SessionsIcon className={classes.menuIcon} />
											دستگاه‌های متصل
										</Typography>
									</MenuItem>
									<Divider />
									<MenuItem onClick={this.handleMenuClose} component={Link} to='/auth/logout/'>
										<Typography className={classes.logout}>
											<LogoutIcon className={classes.menuIcon} />
											خروج
										</Typography>
									</MenuItem>
								</Menu>
							</div>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
		);
	}
}

Header.propTypes = {
	handleSidebarDrawer: propTypes.func.isRequired,
	role: propTypes.string
};
export default withStyles(styles)(Header);
