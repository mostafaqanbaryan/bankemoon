import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Tooltip from '@material-ui/core/Tooltip';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';


const styles = theme => ({
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
	center: {
		paddingRight: '20px'
	}
});

class ColumnHeader extends Component{

	createSortHandler = bankId => {

	};

	render(){
		const { classes, columnData, order, orderBy } = this.props;

		return (
			<TableHead>
				<TableRow>
					{columnData.map(column => {
						let className = '';
						switch(column.hidden){
							case 'xs':
								className = classes.hiddenXs;
								break;
							case 'sm':
								className = classes.hiddenSm;
								break;
							case 'md':
								className = classes.hiddenMd;
								break;
							case 'lg':
								className = classes.hiddenLg;
								break;
							case 'xl':
								className = classes.hiddenXl;
								break;
							default:
								break;
						}
						return(
							<TableCell
								key={column.id}
								className={className}
								numeric={column.numeric}
								padding={column.disablePadding ? 'checkbox' : 'default'}
								sortDirection={orderBy===column.id ? order : false}>
								{!column.noLabel &&
									<Tooltip title='چیدمان' placement={column.numeric ? 'bottom-end' : 'bottom-start'} enterDelay={300}>
										<TableSortLabel active={orderBy === column.id} direction={order} onClick={this.createSortHandler(column.id)}>
											{column.label}
										</TableSortLabel>
									</Tooltip>
								}
							</TableCell>
						);
					})}
				</TableRow>
			</TableHead>
		);
	}
}
export default withStyles(styles)(ColumnHeader);
