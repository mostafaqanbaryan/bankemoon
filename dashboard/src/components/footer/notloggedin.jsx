import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

// Elements
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

// Icons

// Colors

const styles = theme => ({
	root: {
		background: '#eee',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		position: 'relative',
		'@media (max-width:600px)':{
			flexDirection: 'column',
			textAlign: 'center',
		}
	},
	text: {
		paddingTop: 14,
		paddingRight: theme.spacing.unit*2,
	},
	copyright: {
		textDecoration: 'none',
		color: theme.palette.primary.main,
		'&:hover':{
			color: theme.palette.primary.dark
		}
	},
	icon: {
		width: 24,
		height: 24,
	},
});

class Footer extends Component{
	render(){
		const {
			classes,
			style,
		} = this.props;

		return(
			<div className={classes.root} style={style ? style : {}}>
				<section className={classes.text}>
					<Typography variant='caption' component='p'>تمامی حقوق متعلق به <a style={{ color: '#444' }} className={classes.copyright} href='/'>بانکمون</a> است</Typography>
				</section>
				<section>
					<Tooltip title='فیسبوک'>
						<IconButton component='a' rel='index,nofollow' href='https://fb.com/bankemooncom/'>
							<svg className={classes.icon} fill='#3C609C' viewBox="0 0 24 24">
								<path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" />
							</svg>
						</IconButton>
					</Tooltip>
					<Tooltip title='توئیتر'>
						<IconButton component='a' rel='index,nofollow' href='https://twitter.com/AppistGroup/'>
							<svg className={classes.icon} fill='#00A2F4' viewBox="0 0 24 24">
								<path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.066 9.645c.183 4.04-2.83 8.544-8.164 8.544-1.622 0-3.131-.476-4.402-1.291 1.524.18 3.045-.244 4.252-1.189-1.256-.023-2.317-.854-2.684-1.995.451.086.895.061 1.298-.049-1.381-.278-2.335-1.522-2.304-2.853.388.215.83.344 1.301.359-1.279-.855-1.641-2.544-.889-3.835 1.416 1.738 3.533 2.881 5.92 3.001-.419-1.796.944-3.527 2.799-3.527.825 0 1.572.349 2.096.907.654-.128 1.27-.368 1.824-.697-.215.671-.67 1.233-1.263 1.589.581-.07 1.135-.224 1.649-.453-.384.578-.87 1.084-1.433 1.489z" />
							</svg>
						</IconButton>
					</Tooltip>
					<Tooltip title='سروش'>
						<IconButton component='a' rel='index,nofollow' href='https://sapp.com/AppistGroup/'>
							<svg className={classes.icon} fill='#3C9EB5' viewBox="0 0 128 128">
									<path d="M 87.00,121.01 C 87.00,121.01 67.00,124.83 67.00,124.83 56.21,125.86 40.07,121.13 31.00,115.30 20.50,108.56 14.27,102.17 8.60,91.00 2.49,78.95 1.85,72.21 2.00,59.00 2.09,51.45 4.00,42.81 7.26,36.00 25.41,-1.90 76.36,-12.57 107.00,17.04 113.45,23.28 116.68,27.91 120.37,36.00 124.12,44.23 125.89,50.90 126.00,60.00 126.15,73.07 124.07,83.67 117.17,95.00 109.76,107.18 104.15,106.33 104.00,117.00 103.94,121.60 104.31,123.40 103.00,128.00 98.19,126.48 90.65,121.22 87.00,121.01 Z M 70.00,27.48 C 67.26,28.63 65.22,29.99 63.10,32.10 56.52,38.68 54.62,48.06 56.52,57.00 57.81,63.10 60.41,67.13 59.90,74.00 59.31,82.10 52.05,89.65 44.00,90.79 40.97,91.21 37.97,90.53 35.00,90.00 50.74,111.43 94.76,103.92 93.99,72.00 93.80,64.23 90.07,56.24 85.61,50.00 82.48,45.61 76.48,38.69 77.43,33.00 77.85,30.52 79.80,27.28 81.00,25.00 77.22,25.32 73.52,26.00 70.00,27.48 Z M 34.00,89.00 C 34.00,89.00 35.00,90.00 35.00,90.00 35.00,90.00 35.00,89.00 35.00,89.00 35.00,89.00 34.00,89.00 34.00,89.00 Z" />
							</svg>
						</IconButton>
					</Tooltip>
					<Tooltip title='تلگرام'>
						<IconButton component='a' rel='index,nofollow' href='https://t.me/AppistGroup/'>
							<svg className={classes.icon} fill='#00B6E4' style={{ fillRule: 'evenodd' }} viewBox="0 0 24 24">
								<path d="M12,0c-6.626,0 -12,5.372 -12,12c0,6.627 5.374,12 12,12c6.627,0 12,-5.373 12,-12c0,-6.628 -5.373,-12 -12,-12Zm3.224,17.871c0.188,0.133 0.43,0.166 0.646,0.085c0.215,-0.082 0.374,-0.267 0.422,-0.491c0.507,-2.382 1.737,-8.412 2.198,-10.578c0.035,-0.164 -0.023,-0.334 -0.151,-0.443c-0.129,-0.109 -0.307,-0.14 -0.465,-0.082c-2.446,0.906 -9.979,3.732 -13.058,4.871c-0.195,0.073 -0.322,0.26 -0.316,0.467c0.007,0.206 0.146,0.385 0.346,0.445c1.381,0.413 3.193,0.988 3.193,0.988c0,0 0.847,2.558 1.288,3.858c0.056,0.164 0.184,0.292 0.352,0.336c0.169,0.044 0.348,-0.002 0.474,-0.121c0.709,-0.669 1.805,-1.704 1.805,-1.704c0,0 2.084,1.527 3.266,2.369Zm-6.423,-5.062l0.98,3.231l0.218,-2.046c0,0 3.783,-3.413 5.941,-5.358c0.063,-0.057 0.071,-0.153 0.019,-0.22c-0.052,-0.067 -0.148,-0.083 -0.219,-0.037c-2.5,1.596 -6.939,4.43 -6.939,4.43Z" />
							</svg>
						</IconButton>
					</Tooltip>
				</section>
			</div>
		);
	}
}
export default withStyles(styles)(Footer);

