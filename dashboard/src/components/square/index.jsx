import React, { Component } from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => {
	/* let keyframes = {};
	for(let i = 0; i <= 100; i++){
		keyframes[`${i}%`]= {
				background: `linear-gradient(90deg, #eee ${i-6}%, #ddd ${i-1}%, #eee ${i+4}%)`,
		};
	} */
	return({
		square: {
			position: 'absolute',
			background: '#eee',
			opacity: 0.8,
			animation: 'square infinite alternate 2s',
		},
		'@keyframes square': {
			from: {
				background: '#ccc',
			},
			to: {
				background: '#eee',
			}
		}
	});
};

class Square extends Component{
	render(){
		const {
			classes,
			className,
			style,
			top,
			left,
			bottom,
			right,
			height,
			width,
		} = this.props;

		const position = !top && !bottom && !right && !left ? 'relative' : 'absolute';
		return(
			<div className={classNames(classes.square, className)} style={Object.assign({top, left, right, bottom, height, width, position}, style)}></div>
		);
	}
}
export default withStyles(styles)(Square);
