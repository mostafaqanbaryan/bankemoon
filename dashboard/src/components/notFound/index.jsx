import React from 'react';
import { Link } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
	root: {
		margin: theme.spacing.unit*2,
		textAlign: 'center',
		minHeight: 'calc(100vh - 64px - 32px - 210px)',
	},
	item: {
		display: 'inline-block',
		borderLeft: '2px solid #ccc',
		marginTop: theme.spacing.unit * 4,
		marginBottom: theme.spacing.unit * 4,
		paddingLeft: theme.spacing.unit * 3,
		paddingRight: theme.spacing.unit * 3,
		'&:last-child': {
			borderLeft: 0
		},
	},
	link: {
		textDecoration: 'none'
	}
});

class NotFound extends React.Component{
	render(){
		const {
			classes,
			blog
		} = this.props;

		return(
			<Paper className={classes.root}>
				<h1 style={{fontSize: '7rem', marginBottom: 0, marginTop: 0, color: '#333'}}>404</h1>
				<Typography variant='caption'>صفحه موردنظر پیدا نشد</Typography>
				<ul>
					<li className={classes.item}>
						<Typography component={Link} className={classes.link} to='/me/'>صفحه کاربری</Typography>
					</li>
					<li className={classes.item}>
						<Typography component={Link} className={classes.link} to='/'>نمایش تمامی بانک‌ها</Typography>
					</li>
					<li className={classes.item}>
						<Typography component={Link} className={classes.link} to='/messages/'>پیام‌های من</Typography>
					</li>
					<li className={classes.item}>
						<Typography component={Link} className={classes.link} to='/tickets/'>تیکت‌های من</Typography>
					</li>
					<li className={classes.item}>
						<Typography component={'a'} className={classes.link} href={blog.tutorials('')}>آموزش‌ها</Typography>
					</li>
				</ul>
			</Paper>
		);
	}
}
export default withStyles(styles)(NotFound);
