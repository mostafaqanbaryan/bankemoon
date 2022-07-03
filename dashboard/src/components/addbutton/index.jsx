import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import propTypes from 'prop-types';
import classNames from 'classnames';

import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/AddCircle';

const styles = theme => ({
	addBtn: {
		color: theme.colors.primary(1),
		textShadow: '1px 1px 5px #eee'
	},
	addBtnIcon: {
		marginRight: 4,
	},
});

class AddButton extends React.Component{
	render(){
		const {
			classes,
			className,
			to,
			title,
		} = this.props;

		return(
			<Button
				component={Link}
				className={classNames(classes.addBtn, className)}
				to={to}>
				{title}
				<AddIcon className={classes.addBtnIcon} />
			</Button>
		);
	}
}

AddButton.propTypes = {
	to: propTypes.string,
	title: propTypes.string.isRequired,
}

export default withStyles(styles)(AddButton);
