import API from 'api';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import ErrorBoundary from 'components/errorBoundary';

const styles = theme => ({
	post: {
		padding: '0px 15px 15px',
		textAlign: 'justify',
		borderRadius: 0
	},
	postTitle: {
		textDecoration: 'none',
		display: 'block',
		overflow: 'hidden',
		'& > h4': {
			color: theme.colors.primary(1),
			whiteSpace: 'nowrap',
			textOverflow: 'ellipsis',
			overflow: 'hidden',
			marginBottom: '0.5rem' 
		},
	},
	copyright: {
		marginTop: theme.spacing.unit * 2,
		padding: '10px 15px',
	},
	copyrightLink: {
		textDecoration: 'none',
		color: theme.palette.primary.main,
		'&:hover':{
			color: theme.palette.primary.dark
		}
	},
	footer: {
		padding: '12px',
		marginRight: 320,
		transition: theme.transitions.create('margin', {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
		[theme.breakpoints.down('sm')]: {
			marginRight: 0,
		},
	}
});

class Footer extends React.Component{
	state = {
		error: null,
		posts: null,
	};

	handleError = err => this.setState({ error: err.message });

	getPosts = () => {
		const key = 'snapshot';
		const url = `/posts/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result =>{
				this.setState({
					posts: result.data.posts,
					error: null,
				});
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	componentDidMount = () => {
		this.API = new API();
		this.getPosts();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const { classes, blog } = this.props;
		const { posts, error } = this.state;
		let size = 12;
		if(posts){
			if(posts.length === 3)
				size = 4;
			else if(posts.length === 2)
				size = 6;
		}
		const isNotFound = this.props.isNotFound();
		const style = isNotFound ? {marginRight: 0} : !this.props.sidebarOpen ? {marginRight: 80} : {};
		return (
			<footer className={classes.footer} style={style}>
				<ErrorBoundary error={error} reload={this.getPosts}>
					<React.Fragment>
						<Grid container>
							<Grid item xs={12}>
								<Paper style={{ padding: 15, borderRadius: 0 }} elevation={3}>
									<Typography variant='title'>
										{posts
											? 'آخرین خبرها'
											: 'درحال دریافت آخرین خبرها...'
										}</Typography>
								</Paper>
							</Grid>
							{posts && posts.map(post => (
								<Grid item xs={12} sm={size} key={post.title}>
									<Paper className={classes.post} elevation={3}>
										<a className={classes.postTitle} href={blog.news(post.title)} target='_blank'>
											<h4>{post.title}</h4>
										</a>
										<Typography component='p' noWrap>{post.excert}</Typography>
									</Paper>
								</Grid>
							))}
						</Grid>
						<Paper className={classes.copyright} elevation={3} style={{ textAlign: 'center' }}>
							<Typography variant='caption' component='p'>تمامی حقوق متعلق به بانکمون است</Typography>
							<Typography variant='caption' component='p' style={{ marginTop: '0.8rem' }}>
								<a style={{ color: '#444' }} className={classes.copyrightLink} href='/'>بانکمون</a> 1397
							</Typography>
						</Paper>
					</React.Fragment>
				</ErrorBoundary>
			</footer>
		);
	}
}
export default withStyles(styles)(Footer);
