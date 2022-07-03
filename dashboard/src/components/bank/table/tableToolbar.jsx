import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';

// Elements
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Toolbar from '@material-ui/core/Toolbar';

// Icons
import DeleteIcon from '@material-ui/icons/Delete';
import NoteAddIcon from '@material-ui/icons/NoteAdd';


const styles = theme => ({
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

class TableToolbar extends Component{
	render(){
		const { numSelected, classes, handleShowTransaction } = this.props;
		return (
			<Toolbar
				className={classNames(classes.root, {
					[classes.highlight]: numSelected > 0,
				})}
			>
				<div className={classes.title}>
					{numSelected > 0 ? (
						<Typography variant="subheading">{numSelected} کاربر انتخاب شده</Typography>
					) : (
						<Typography variant="title">لیست اعضا</Typography>
					)}
				</div>
				<div className={classes.spacer} />
				<div className={classes.actions}>
					{numSelected > 0 ? (
						<div>
							<Tooltip title="ثبت گروهی تراکنش">
								<IconButton onClick={handleShowTransaction} aria-label="ثبت گروهی تراکنش">
									<NoteAddIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="حذف گروهی اعضا">
								<IconButton aria-label="حذف گروهی اعضا">
									<DeleteIcon />
								</IconButton>
							</Tooltip>
						</div>
					) : ''}
				</div>
			</Toolbar>
		);
	}
}
export default withStyles(styles)(TableToolbar);
