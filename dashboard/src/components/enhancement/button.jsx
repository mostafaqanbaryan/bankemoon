import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

const styles = theme => ({
	primary: {
		color: '#eee',
		background: theme.colors.primary(1),
		'&:focus, &:hover': {
			background: theme.colors.primary(0.9),
		}
	}
});

class ButtonEnhancement extends React.Component{
	render(){
		const {
			classes,
			primary,
			className,
			...props
		} = this.props;

		return(
			<Button
				className={classNames(primary ? classes.primary : '', className)}
				{...props}
			/>
		);
	}
}

export default withStyles(styles)(ButtonEnhancement);
