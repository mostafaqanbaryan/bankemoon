import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import propTypes from 'prop-types';

import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
	emptyList: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		color: '#bbb',
		fontWeight: 200,
		fontSize: '1.5rem',
		minHeight: 200,
		height: `calc(100vh - ${theme.footer.height}px - ${theme.header.height}px - 80px)`,
	}
});

class EmptyList extends React.Component{
	render(){
		const data = this.props.data;
		const content = this.props.content ? this.props.content : 'لیست خالی است';
		const ele = this.props.noShadow ? 0 : 2;
		if(!data || (data && data.length <= 0))
			return(
				<Paper elevation={ele}>
					<Typography className={this.props.classes.emptyList}>
						{content}
					</Typography>
				</Paper>
			);
		else
			return this.props.children;
	}
}

EmptyList.propTypes = {
	data: propTypes.array.isRequired || propTypes.string.isRequired,
	content: propTypes.string,
};

export default withStyles(styles)(EmptyList);
