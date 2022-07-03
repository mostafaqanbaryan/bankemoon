import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import NextIcon from '@material-ui/icons/ChevronLeft';
import PrevIcon from '@material-ui/icons/ChevronRight';

import moment from 'moment-jalaali'

moment.loadPersian({ dialect: 'persian-modern'});

const styles = theme => ({
	clickAway: {
		position: 'fixed',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 1
	},
	root: {
		display: 'inline-block',
	},
	content: {
		position: 'relative',
	},
	textField: {
		direction: 'ltr',
		textAlign: 'left',
		paddingLeft: theme.spacing.unit,
	},
	textFieldLabel: {
		direction: 'rtl',
		alignSelf: 'center',
		textAlign: 'right',
		display: 'inline-block',
		fontSize: '0.8rem',
		fontWeight: 200,
		minWidth: 50,
	},
	wrapper: {
		fontFamily: 'IRANSans',
		position: 'absolute',
		top: 38,
		// bottom: 0,
		// right: '50%',
		zIndex: 10,
		backgroundColor: 'white',
		border: `1px solid ${theme.colors.primary(0.8)}`,
		boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
		padding: '10px !important',
		display: 'flex',
		minWidth: 222,
		width: '100%',
		flexDirection: 'column',
		[theme.breakpoints.down('xs')]: {
			position: 'fixed',
			top: 0,
			bottom: 0,
			right: 0,
			left: 0,
			overflow: 'auto',
			display: 'block',
			padding: '0px !important',
		}
	},
	btn: {
		fontFamily: 'IRANSans',
		marginTop: 'auto',
		width: '100%',
		padding: '10px 30px',
		borderRadius: 5,
		border: `3px ${theme.colors.primary(1)} solid`,
		background: theme.colors.primary(1),
		color: 'white',
		boxShadow: 'none',
		cursor: 'pointer',
		transition: 'all 0.4s ease-in-out',
		willChange: 'background, box-shadow',
		'&:hover': {
			background: 'slategray',
			borderColor: 'slategray',
			color: 'white'
		}
	},

	calendar: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignContent: 'center',
		alignItems: 'center',
		boxSizing: 'border-box',
		width: '100%',
		marginBottom: 20,
		minHeight: 316
	},
	header: {
		display: 'flex',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 5,
		color: 'grey',
		direction: 'rtl',
		'&>*': {
			verticalAlign: 'middle',
		}
	},
	iconAndTextInRow: {
		display: 'flex',
		justifyContent: 'center',
		alignContent: 'center',
		alignItems: 'center',
		cursor: 'pointer',
		fontWeight: 'bold',
		width: 35,
		'&:hover': {
			color: theme.colors.primary(0.8),
		}
	},
	headerLabel: {
		fontWeight: 'bold',
		fontSize: '1.2rem',
		direction: 'ltr',
		boxSizing: 'border-box',
		textAlign: 'center',
		color: 'grey'
	},
	weeksContainer: {
		width: '100%',
		transition: 'height 0.3s linear',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignContent: 'center',
		alignItems: 'center',
	},
	weeksContainerWeek: {
		margin: '2.5px 0',
		justifyContent: 'space-between',

		direction: 'rtl',
		width: '100%',
		display: 'flex',
	},
	weeksContainerWeekDay: {
		width: 50,
		height: 30,
		borderRadius: 5,
		display: 'flex',
		justifyContent: 'center',
		alignContent: 'center',
		alignItems: 'center',
		'&:not(.selected):hover': {
			backgroundColor: 'yellowsilver'
		},
		'&:not(last-child):hover': {
			backgroundColor: theme.colors.primary(0.8),
		},


		boxSizing: 'border-box',
		textAlign: 'center',
		// display: 'inline-block',
		verticalAlign: 'middle',
		cursor: 'pointer',
		color: 'black',
	},
	week: {
		direction: 'rtl',
		width: '100%',
		display: 'flex',
		justifyContent: 'space-between'
	},
	day: {
		boxSizing: 'border-box',
		textAlign: 'center',
		display: 'inline-block',
		verticalAlign: 'middle',
		cursor: 'pointer',
		color: 'black',
	},
	today: {
		border: `2px ${theme.colors.primary(0.8)} solid`,
	},
	differentMonth: {
		color: 'grey'
	},
	selectedDay: {
		background: theme.colors.primary(0.8),
		color: 'white',
	},
	weekNames: {
		margin: '10px 0 20px 0',
		padding: '10px 0',
		borderRadius: 5,
		backgroundColor: theme.colors.primary(0.8),
		direction: 'rtl',
		width: '100%',
		display: 'flex',
		justifyContent: 'space-between',
		textAlign: 'center',
	},
	weekNamesLabel: {
		color: 'white',
		fontSize: 13,
		fontWeight: 'bold',
		width: 50,
		cursor: 'initial',
	}
});

const Week = ({ classes, date, month, select, selected }) => {
	let days = []

	for (let i = 0; i < 7; i++) {
		const day = {
			name: date.format('jdd').substring(0, 1),
			number: date.jDate(),
			isCurrentMonth: date.jMonth() === month.jMonth(),
			isToday: date.isSame(new Date(), 'day'),
			date: date
		}

		const className = classNames(
			classes.weeksContainerWeekDay,
			day.isToday ? classes.today : '',
			day.isCurrentMonth ? '' : classes.differentMonth,
			day.date.isSame(selected) ? classes.selectedDay : ''
		);

		days.push(
			<span key={day.date.toString()} className={className} onClick={() => select(day)}>
				{day.number}
			</span>
		)

		date = date.clone()
		date.add(1, 'd')
	}

	return (
		<div className={classes.weeksContainerWeek} key={days[0].toString()}>
			{days}
		</div>
	)
};

const DayNames = ({ classes }) => (
	<div className={classes.weekNames}>
		<span className={classes.weekNamesLabel}>ش</span>
		<span className={classes.weekNamesLabel}>ی</span>
		<span className={classes.weekNamesLabel}>د</span>
		<span className={classes.weekNamesLabel}>س</span>
		<span className={classes.weekNamesLabel}>چ</span>
		<span className={classes.weekNamesLabel}>پ</span>
		<span className={classes.weekNamesLabel}>ج</span>
	</div>
);

const RenderWeeks = ({ classes, month, select, selected }) => {
	let weeks = []
	let done = false
	// start the week with SHANBE, so instead of day()
	// we user weekday for locale aware day index
	let date = month
		.clone()
		.startOf('jMonth')
		.weekday(0)

	let monthIndex = date.jMonth()

	let count = 0

	while (!done) {
		weeks.push(
			<Week
				key={date.toString()}
				date={date.clone()}
				month={month}
				select={select}
				selected={selected}
				classes={classes}
			/>
		)
		date.add(1, 'w')
		done = count++ > 2 && monthIndex !== date.jMonth()
		monthIndex = date.jMonth()
	}

	return <div className={classes.weeksContainer}>{weeks}</div>
};

class DateInput extends React.Component{
	state = {
		showCalendar: false,
		month: moment().startOf('jMonth'), // "selected" is a moment object
		selectedDay: moment().startOf('jDay')
	};

	previous = () => {
		let month = this.state.month;
		month.subtract(1, 'month');
		this.setState({ month: month });
		this.selectFirstDayOfMonth(month);
	}

	next = () => {
		let month = this.state.month;
		month.add(1, 'month');
		this.setState({ month: month });
		this.selectFirstDayOfMonth(month);
	}

	selectFirstDayOfMonth = month => {
		this.setState({
			selectedDay: month.clone().startOf('jMonth')
		});
	}

	today = () => {
		const month = moment().startOf('jMonth');
		const selectedDay = moment().startOf('jDay');
		this.setState({
			month, // "selected" is a moment object
			selectedDay,
			showCalendar: false,
		});
		this.props.onChange && this.props.onChange(moment().format('jYYYY-jMM-jDD'));
		this.props.onClick && this.props.onClick(selectedDay._d, selectedDay.format('jYYYY/jMM/jDD'));
	}

	select = day => {
		this.setState({
			selectedDay: day.date,
			showCalendar: false,
		});
		this.props.onClick && this.props.onClick(day.date._d, day.date.format('jYYYY/jMM/jDD'));
		// onChange && onChange(day.date.format('jYYYY-jMM-jDD'));
	}

	handleFocus = e => {
		this.setState({ showCalendar: true });
	}

	handleClose = e => {
		this.setState({ showCalendar: false })
	}

	render() {
		const {
			classes,
			label,
			fullWidth
		} = this.props;
		const {
			showCalendar,
			selectedDay
		} = this.state;

		return (
			<div className={classes.root} style={fullWidth ? {width: '100%'} : {}}>
				<div className={classes.content}>
					<TextField
						className={classes.textField}
						onFocus={this.handleFocus}
						value={selectedDay.format('jYYYY/jMM/jDD')}
						fullWidth={fullWidth}
						InputProps={{
							style: fullWidth ? { width: '100%' } : {},
							readOnly: true,
							endAdornment:
								<Typography component='span' className={classes.textFieldLabel}>
									{label}
								</Typography>
						}}
					/>

					<div
						onClick={this.handleClose}
						className={classes.clickAway}
						style={showCalendar ? {} : {display: 'none'}}></div>

					{showCalendar &&
						<div className={classes.wrapper}>
							<div className={classes.calendar}>
								<div className={classes.header}>
									<div className={classes.iconAndTextInRow} onClick={this.previous}>
										<PrevIcon className={classes.headerLabel} />
									</div>
									<span className={classes.headerLabel}>{this.state.month.format('jYYYY jMMMM')}</span>
									<div className={classes.iconAndTextInRow} onClick={this.next}>
										<NextIcon className={classes.headerLabel} />
									</div>
								</div>
								<DayNames
									classes={classes}
								/>
								<RenderWeeks
									classes={classes}
									select={this.select}
									month={this.state.month}
									selected={this.state.selectedDay}
								/>
							</div>
							<button
								className={classes.btn}
								onClick={this.today}>
								برو به امروز
							</button>
						</div>
					}
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(DateInput);
