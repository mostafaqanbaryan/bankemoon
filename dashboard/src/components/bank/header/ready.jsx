import React from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

// Elements
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import SvgIcon from '@material-ui/core/SvgIcon';
import Tooltip from '@material-ui/core/Tooltip';
import ButtonBase from '@material-ui/core/ButtonBase';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Square from 'components/square';

// Icon
import EditIcon from '@material-ui/icons/ModeEdit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = theme => ({
	title: {
		background: theme.palette.common.white,
		boxShadow: theme.shadows[4],
		padding: '5px 10px',
		marginBottom: 10,
	},
	inline: {
		display: 'inline',
	},
	avatar: {
		width: 70,
		height: 70,
		marginLeft: 'auto',
		marginRight: 'auto',
	},

	rightSection: {
		[theme.breakpoints.down('xs')]: {
			textAlign: 'center',
		}
	},
	/* leftSection:{
		marginTop: '20px',
	}, */
	bankInfoExpandRoot: {
		float: 'left',
		background: 'white',
		color: 'gray',
		padding: 0,
		fontSize: '0.7rem',
		fontWeight: '300',
		width: 36,
		height: 36,
		boxShadow: '0 6px 8px -5px #111',
		marginTop: -13,
		borderRadius: '50%',
	},
	bankInfoExpand: {
		transition: 'height 0.5s',
		overflow: 'hidden',
	},
	bankInfoExpandMore: {
		height: '100%',
	},
	bankInfoExpandLess: {
		height: 0,
	},
	bankInfoButton: {
		transition: 'transform 0.5s',
	},
	bankInfoExpandText: {
		fontSize: '0.7rem',
		whiteSpace: 'pre-line',
	},
});

class BankHeader extends React.Component{
	state = {
		expandMore: false,
	}

	onClickToggle = name => e => {
		this.setState(prev => ({ [name]: !prev[name] }));
	}

	onClickExpandMore = e => {
		let more = e.currentTarget.previousElementSibling;
		if(!this.state.expandMore){
			let child = more.getElementsByTagName('div')[0];
			let height = child.clientHeight + 20;
			more.style.height = `${height}px`;
		}else{
			more.style.height = 0;
		}
		this.setState(prev => ({ expandMore: !prev.expandMore }));

		if(!this.props.options){
			this.props.getBankOptions();
		}
	}

	render(){
		const {
			options
		} = this.props;
		const {
			expandMore,
		} = this.state;

		const {
			classes,
			types,
			title,
			username,
			avatar,
			createdAt,
			role,
		} = this.props;

		const base = `/@${username}`;
		return(
			<div className={classes.title}>
				<Grid container>
					<Grid className={classes.rightSection} item xs={12} sm={10}>
						<Typography className={classes.inline} variant='title'>
							{title}
						</Typography>

						{(role === 'BankAdmin' || role === 'Creator') &&
							<Tooltip placement='left' title='ویرایش'>
								<IconButton component={Link} to={`${base}/edit/`}>
									<EditIcon />
								</IconButton>
							</Tooltip>
						}

						<Tooltip placement='left' title='ارتقا بانک'>
							<IconButton component={Link} to={`${base}/plan/`}>
								<SvgIcon color='action'>
									<path style={{transform: 'rotate(-45deg)', transformOrigin: 12}} d="M2.81,14.12L5.64,11.29L8.17,10.79C11.39,6.41 17.55,4.22 19.78,4.22C19.78,6.45 17.59,12.61 13.21,15.83L12.71,18.36L9.88,21.19L9.17,17.66C7.76,17.66 7.76,17.66 7.05,16.95C6.34,16.24 6.34,16.24 6.34,14.83L2.81,14.12M5.64,16.95L7.05,18.36L4.39,21.03H2.97V19.61L5.64,16.95M4.22,15.54L5.46,15.71L3,18.16V16.74L4.22,15.54M8.29,18.54L8.46,19.78L7.26,21H5.84L8.29,18.54M13,9.5A1.5,1.5 0 0,0 11.5,11A1.5,1.5 0 0,0 13,12.5A1.5,1.5 0 0,0 14.5,11A1.5,1.5 0 0,0 13,9.5Z" />
								</SvgIcon>
							</IconButton>
						</Tooltip>

						<Typography style={{fontSize: '0.85rem'}} color='textSecondary' gutterBottom={true} variant='subheading'>
							{role ? `${types.user.bank[role]} بانک` : 'صاحب حساب'}
						</Typography>
					</Grid>

					<Grid item xs={12} sm={2}>
						<Avatar className={classes.avatar} src={avatar} />
					</Grid>
				</Grid>

				<section>
					<div className={classNames(classes.bankInfoExpand, expandMore ? classes.bankInfoExpandMore : classes.bankInfoExpandLess)}>
						<hr />
						<Grid container style={{ paddingBottom: 8 }}>
							<Grid item xs={12} sm={6}>
								<Typography className={classes.bankInfoExpandText}
									color='textSecondary' gutterBottom={true}
									component='p' variant='subheading'>
									تاریخ تاسیس {createdAt}
								</Typography>
							</Grid>

							<Grid item xs={12} sm={6}>
								{options
									? <Typography className={classes.bankInfoExpandText}
											color='textSecondary' gutterBottom={true}
											component='p' variant='subheading'>
											{options && options.shaba
												? `حساب ثبت شده به نام ${options.owner} با شماره شبای ${options.shaba}`
												: 'شماره حساب ثبت نشده است'
											}
										</Typography>
									: <Square height={16} width='50%'/>
								}
							</Grid>

							<Grid item xs={12} sm={6}>
								{options
									? <Typography className={classes.bankInfoExpandText}
											color='textSecondary' gutterBottom={true}
											component='p' variant='subheading'>
											{options && options.rules
													? options.rules
													: 'قوانین ثبت نشده است'}
										</Typography>
									: <Square height={16} width='50%'/>
								}
							</Grid>

							<Grid item xs={12} sm={6}>
								{options
									? <Typography className={classes.bankInfoExpandText}
											color='textSecondary' gutterBottom={true}
											component='p' variant='subheading'>
											{options.description
													? options.description
													: 'توضیحات ثبت نشده است'}
										</Typography>
									: <Square height={16} width='50%'/>
								}
							</Grid>
						</Grid>
					</div>

					<ButtonBase
						className={classes.bankInfoExpandRoot}
						onClick={this.onClickExpandMore}>
						<ExpandMoreIcon
							className={classes.bankInfoButton}
							style={expandMore ? {transform: 'rotate(180deg)'} : {}} />
					</ButtonBase>
				</section>
			</div>
		);
	}
}

export default withStyles(styles)(BankHeader);
