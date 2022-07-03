import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import DocumentTitle from 'components/documentTitle';
import Header from 'components/header';
// import Footer from 'components/footer';

const styles = theme => ({
	errorCardFullScreen: {
		background: 'rgba(158, 60, 60, 0.9)',
		textAlign: 'center',
		height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		borderRadius: 0,
	},
	errorCard: {
		background: 'rgba(158, 60, 60, 0.9)',
		textAlign: 'center',
		minHeight: 200,
		height: `calc(100vh - ${theme.header.height}px - ${theme.footer.height}px)`,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
	},
	error: {
		color: '#fff',
		whiteSpace: 'pre-wrap',
	},
	errorBtn: {
		color: '#333',
		textShadow: '0px 0px 1px #888',
		marginTop: theme.spacing.unit * 2,
	},
});

class ErrorBoundary extends React.Component{
	state = {
		hasError: false,
		error: null,
		countDown: 5,
	};

	actionReload = name => () => {
		this.props.reload();
		this.disableReload();
		this.setState({ countDown: 5 });
		if(name === 'usr') {
			// this.setState({ countDown: 2 });
		}
		else {
			/* this.setState(prev => ({
				countDown: prev.countDown <= 64 ? prev.countDown * 2 : 64,
			})); */
		}
	};

	enableReload = (countDown = this.state.countDown) => {
		this.interval.push(setInterval(() => {
			this.actionReload('a')();
		}, countDown * 1000));
	};

	disableReload = () => {
		for(let i in this.interval){
			clearInterval(this.interval[i]);
			delete this.interval[i];
		}
	}

	componentDidCatch(error, info){
		this.setState({
			hasError: true,
			error,
		});
	}

	/* componentWillMount = () => {
		this.interval = [];
	}; */

	/* componentWillUnmount = () => {
		this.disableReload();
	}; */

	/* componentDidUpdate = () => {
		this.disableReload();
		if(this.props.reload && (this.state.error || this.props.error)){
			this.enableReload();
		}
	} */

	render(){
		const classes = this.props.classes;
		const error = this.props.error;
		const fullScreen = this.props.fullScreen;

		if(this.state.hasError || error){
			return (
				<section>
					<DocumentTitle title='خطا'>
						{fullScreen && <Header
							user={null}
							isLoggedIn={false}
							className={classes.footer}
							sidebarShow={false}
							sidebarOpen={false}
							style={{
								position: 'absolute',
								bottom: 0,
								right: 0,
								left: 0,
							}}
						/>}
						<Card className={fullScreen ? classes.errorCardFullScreen : classes.errorCard} elevation={0}>
							<Typography className={classes.error}>
								{error ? error : this.state.error}
							</Typography>
							{this.props.reload &&
								<Button
									fullWidth
									className={classes.errorBtn}
									onClick={this.actionReload('usr')}>
									تلاش مجدد
									{/*<Loading
										className={classes.loading}
										color='#555'
										show={true} /> */}
									</Button>
							}
						</Card>
					</DocumentTitle>
				</section>
			);
		}else{
			return this.props.children;
		}
	}
}

export default withStyles(styles)(ErrorBoundary);
