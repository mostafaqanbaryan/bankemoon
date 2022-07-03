import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Grow from '@material-ui/core/Grow';

const styles = theme => ({
	hidden: {
		display: 'none',
	},
	rotate: {
		animation: 'lr 1s infinite linear',
		marginRight: theme.spacing.unit,
	},
	wholeRotate: {
		animation: 'lr 3.5s infinite linear',
	},
	path: {
		animation: 'ls 1.2s infinite ease-in',
	},
	'@keyframes lr': {
		'from': {
			transform: 'rotate(0deg)',
		},
		'to': {
			transform: 'rotate(360deg)',
		},
	},
	'@keyframes ls': {
		'0%, 100%': {
			strokeDasharray: '10, 100'
		},
		'50%': {
			strokeDasharray: '90, 100'
		},
	},
});

class ButtonLoading extends React.Component{
	render(){
		let {
			classes,
			className,
			style,
			width,
			height,
			color,
			show,
		} = this.props;

		width = width ? width : 20;
		height = height ? height : 20;
		switch(color){
			case 'primary':
				color = '#3f51b5';
				break;
			case 'secondary':
				color = '#f50057';
				break;
			case null:
			case undefined:
				color = '#888';
				break;
			default:
				break;
		}
		// color = color ? color : '#888';
		return(
			<Grow timeout={show ? 1000 : 0} in={show}>
				<div className={classNames(classes.rotate, className, show ? '' : classes.hidden)} style={Object.assign({width, height }, style)}>
					<svg className={classes.wholeRotate} width={width} height={height} viewBox="0 0 36 36">
						<g>
							<path d="M18 2.0845
									a 15.9155 15.9155 0 0 1 0 31.831
									a 15.9155 15.9155 0 0 1 0 -31.831"
									className={classes.path}
									fill="none"
									stroke={color}
									strokeWidth="4"
									strokeLinecap="round"
									strokeDasharray="85, 100"></path>
						</g>
					</svg>
				</div>
			</Grow>
		);
	}
}

export default withStyles(styles)(ButtonLoading);
