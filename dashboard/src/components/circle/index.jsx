import React, { Component } from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
	circle: {
		position: 'absolute',
		background: '#eee',
		opacity: 0.8,
		borderRadius: '50%',
		animation: 'circle infinite alternate 2s',
	},
	'@keyframes circle': {
		from: {
			background: '#ccc',
		},
		to: {
			background: '#eee',
		}
	}
})

class Circle extends Component{
	render(){
		const {
			classes,
			className,
			style,
			top,
			left,
			bottom,
			right,
			diameter,
		} = this.props;

		const position = !top && !bottom && !right && !left ? 'relative' : 'absolute';
		return(
			<div className={classNames(classes.circle, className)} style={Object.assign({top, left, right, bottom, position, height: diameter, width: diameter}, style)}></div>
		);
	}
}
export default withStyles(styles)(Circle);

