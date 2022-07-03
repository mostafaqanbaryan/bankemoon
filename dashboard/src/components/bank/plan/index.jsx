import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Title from 'components/title';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

// Icons
import FreeIcon from '@material-ui/icons/SupervisorAccount';
import PriceIcon from '@material-ui/icons/Store';

import UserCountIcon from '@material-ui/icons/SupervisorAccount';
import ShoppingIcon from '@material-ui/icons/AccountBalance';
import MessageIcon from '@material-ui/icons/Mail';
import CommissionIcon from '@material-ui/icons/StoreMallDirectory';

const styles = theme => ({
	item: {
		textAlign: 'center',
	},
});

class Plan extends React.Component{
	state = {
	};

	handleError = err => this.props.handleOpenSnack({
		message: err.message,
		variant: 'error',
	});

	handlePurchase = e => {
	};

	componentDidMount = () => {
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	items = [
		{
			id: 'bronze',
			icon: <FreeIcon stroke='#5a3100' style={{ width: '100%',  height: '50%', color: '#CD7F32' }} />,
			color: '#CD7F32',
			title: 'طرح برنزی',
			userCount: 'حداکثر 50 حساب',
			shopping: 'پرداخت اینترنتی اجباری',
			commission: '1.0٪ کارمزد پرداخت اینترنتی',
			message: 'عدم قابلیت ارسال پیام',
			priceLabel: 'رایگان',
			priceIcon: null
		},
		{
			id: 'silver',
			icon: <FreeIcon stroke='darkgray' style={{ width: '100%',  height: '50%', color: 'gray' }} />,
			color: 'gray',
			title: 'طرح نقره‌ای',
			userCount: 'حداکثر 200 حساب',
			shopping: 'پرداخت اینترنتی اختیاری',
			commission: '0.5٪ کارمزد پرداخت اینترنتی',
			message: 'قابلیت ارسال پیام فردی',
			priceLabel: '5,000 تومان',
			priceIcon: <PriceIcon style={{marginLeft: 8}} />
		},
		{
			id: 'gold',
			icon: <FreeIcon stroke='#826f01' style={{ width: '100%',  height: '50%', color: '#FFD700' }} />,
			color: '#FFD700',
			title: 'طرح طلایی',
			userCount: 'حداکثر 500 حساب',
			shopping: 'پرداخت اینترنتی اختیاری',
			commission: '0.2٪ کارمزد پرداخت اینترنتی',
			message: 'قابلیت ارسال پیام جمعی',
			priceLabel: '10,000 تومان',
			priceIcon: <PriceIcon style={{marginLeft: 8}} />
		},
	];

	render(){
		const {
			classes
		} = this.props;

		const base = '/@' + this.props.match.params.bankUsername;
		return (
			<Paper>
				<Title padding label={'ارتقای بانک'} help='/tutorial/bank/plan' back={`${base}/`} />
				<Grid container spacing={8} style={{ padding: 8 }}>
					{this.items.map(item => (
						<Grid className={classes.item} item md={4}>
							{item.icon}
							<Typography style={{ color: item.color, textShadow: `0 0 3px ${item.color}` }} variant='title'>{item.title}</Typography>
							<List>
								<ListItem>
									<ListItemIcon>
										<UserCountIcon />
									</ListItemIcon>
									<ListItemText inset primary={item.userCount} />
								</ListItem>

								<ListItem>
									<ListItemIcon>
										<ShoppingIcon />
									</ListItemIcon>
									<ListItemText inset primary={item.shopping} />
								</ListItem>

								<ListItem>
									<ListItemIcon>
										<CommissionIcon />
									</ListItemIcon>
									<ListItemText inset primary={item.commission} />
								</ListItem>

								<ListItem>
									<ListItemIcon>
										<MessageIcon />
									</ListItemIcon>
									<ListItemText inset primary={item.message} />
								</ListItem>
							</List>
							<Button fullWidth size='large' color='primary' variant='raised' onClick={this.handlePurchase(item.id)}>
								{item.priceIcon}
								{item.priceLabel}
							</Button>
						</Grid>
					))}
				</Grid>
			</Paper>
		);
	}
}
export default withStyles(styles)(Plan);
