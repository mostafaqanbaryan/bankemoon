import React from 'react';
import utils from 'utils';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

// Elements
import IconButton from '@material-ui/core/IconButton';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

// Icons
import ActiveIcon from '@material-ui/icons/CheckCircle';
import DeleteIcon from '@material-ui/icons/Cancel';
import Green from '@material-ui/core/colors/green';

const styles = theme => ({
	tableRow: {
		position: 'relative',
		height: '96px',
	},
	relative: {
		position: 'relative'
	},
	cancel: {
		color: theme.palette.error.main
	},
	active: {
		color: Green.A700
	},
	en: {
		direction: 'ltr',
		textAlign: 'left',
		fontFamily: theme.fonts.en,
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

class Session extends React.Component{
	render(){
		const {
			classes,
			sessions,
			handleDeleteSession,
		} = this.props;

		return(
			<TableBody>
				{sessions.map(n => {
					const created_shamsi = utils.Miladi2Shamsi(n.created_at, 'jYYYY/jMM/jDD');
					const updated_at = new Date(n.updated_at);
					const diff = utils.getDifference(Date.now(), updated_at);
					const lastVisit = diff.label === 'امروز' ? diff.label : `${diff.value} ${diff.label} قبل`;

					return (
						<TableRow
							className={classes.tableRow}
							hover
							role="link"
							tabIndex={-1}
							key={n.id}>
							<TableCell className={classes.hiddenSm}>{created_shamsi}</TableCell>
							<TableCell className={classes.hiddenXs}>{lastVisit}</TableCell>
							<TableCell className={classes.en} padding="checkbox">{n.user_agent}</TableCell>
							<TableCell className={classNames(classes.en, classes.hiddenMd)} numeric>{n.ip}</TableCell>
							<TableCell numeric>
								{!n.active
									? <IconButton
											className={classes.cancel}
											onClick={handleDeleteSession(n.id)}>
											<DeleteIcon />
										</IconButton>
									: <IconButton
											className={classes.active}>
											<ActiveIcon />
										</IconButton>
								}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		);
	}
}

export default withStyles(styles)(Session);

