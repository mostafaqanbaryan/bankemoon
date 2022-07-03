import React from 'react';
import propTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

import NextIcon from '@material-ui/icons/NavigateNext';
import LastPageIcon from '@material-ui/icons/LastPage';
import PrevIcon from '@material-ui/icons/NavigateBefore';
import FirstPageIcon from '@material-ui/icons/FirstPage';

const styles = theme => ({
	pagination: {
		textAlign: 'center',
	},
	btn: {
		minWidth: 55,
		height: 60,
		[theme.breakpoints.down('xs')]: {
			height: 38,
		}
	},
	active: {
		background: '#eee',
	},
	small: {
		display: 'block',
	}
});

class Pagination extends React.Component{
	state = {
		buttons: [],
		num: 0,
	}

	getMargins = () => {
		const num = this.state.num;
		const countPage = Math.ceil(this.props.total / this.props.rowsPerPage);
		const currentPage = parseInt(this.props.currentPage, 10);
		const mDown = currentPage - num - 1 <= 0 ? num-(currentPage -num -1) : num;
		const mUp = countPage - currentPage <= num ? num*2 - countPage + currentPage : num;
		const marginDown = currentPage - mUp < 1 ? 1 : currentPage - mUp;
		const marginUp = currentPage + mDown > countPage ? countPage : currentPage + mDown;
		if(this.state.marginUp !== marginUp || this.state.marginDown !== marginDown)
			this.setState({ marginUp, marginDown });
	}

	onResize = () => {
		const width = window.innerWidth;
		let num = 0;
		if(width < 500)
			num = 0;
		else if(width < 610)
			num = 1;
		else if(width < 800)
			num = 2;
		else if(width < 1200)
			num = 3;
		else if(width < 1800)
			num = 5;
		else if(width >= 1800)
			num = 9;
		if(this.state.num !== num)
			this.setState({ num });
	}

	eventResize = () => {
		this.onResize();
		this.getMargins();
	}

	getButtons = () => {
		const {
			marginDown,
			marginUp,
		} = this.state;
		let buttons = [];
		for(let i = marginDown; i <= marginUp; i++)
			buttons.push(i);
		return buttons;
	}

	isActive = key => {
		const current = parseInt(this.props.currentPage, 10);
		return key === current;
	}

	isSmall = () => {
		return window.innerWidth < 500;
	}

	handleClick = page => e => {
		if(this.props.reload && !this.isActive(page)) {
			this.props.reload(page);
		}
	};

	componentDidUpdate = () => {
		this.eventResize();
	}

	componentDidMount = () => {
		window.addEventListener('resize', this.eventResize);
		this.getMargins();
	}

	componentWillUnmount = () => {
		window.removeEventListener('resize', this.eventResize);
	}

	render(){
		const {
			classes,
			className,
			style,
			currentPage,
			rowsPerPage,
			total,
			base,
		} = this.props;

		const countPage = Math.ceil(total / rowsPerPage);
		const current = parseInt(currentPage, 10);

		const first = { page: 1, to: `${base}/` };
		const last = { page: countPage, to: `${base}/page/${countPage}/` };
		const next = { page: current+1, to: `${base}/page/${current+1}/` };
		const prev = current-1 <= 1
			? { page: 1, to: `${base}/` }
			: { page: current-1, to: `${base}/page/${current-1}/` };

		return(
			<div className={classNames(classes.pagination, className)} style={style}>
				<Button
					className={classNames(
							classes.btn,
							this.isSmall() ? classes.small : '',
						)
					}
					key={1}
					onClick={this.handleClick(first.page)}
					component={Link}
					disabled={current <= 1}
					to={first.to}>
					{this.isSmall()
						?'صفحه اول'
						: <LastPageIcon />
					}
				</Button>
				<Button
					className={classNames(
							classes.btn,
							this.isSmall() ? classes.small : '',
						)
					}
					key='prev'
					onClick={this.handleClick(prev.page)}
					component={Link}
					disabled={current <= 1}
					to={prev.to}>
					{this.isSmall()
						? 'قبلی'
						: <NextIcon />
					}
				</Button>

				{this.getButtons().map(i => (
					<Button
						key={i}
						onClick={this.handleClick(i)}
						className={classNames(
								classes.btn,
								this.isActive(i) ? classes.active : '',
								this.isSmall() ? classes.small : '',
							)
						}
						component={Link}
						to={i === 1 ? `${base}/` : `${base}/page/${i}/`}>
						{i}
					</Button>
				))}

				<Button
					className={classNames(
							classes.btn,
							this.isSmall() ? classes.small : '',
						)
					}
					key='next'
					disabled={current+1 > countPage}
					onClick={this.handleClick(next.page)}
					component={Link}
					to={next.to}>
					{this.isSmall()
						? 'بعدی'
						: <PrevIcon />
					}
				</Button>
				<Button
					className={classNames(
							classes.btn,
							this.isSmall() ? classes.small : '',
						)
					}
					key='last'
					disabled={current >= countPage}
					onClick={this.handleClick(last.page)}
					component={Link}
					to={last.to}>
					{this.isSmall()
						? 'صفحه آخر'
						: <FirstPageIcon />
					}
				</Button>
			</div>
		);
	}
}

Pagination.propTypes = {
	total: propTypes.number.isRequired,
	currentPage: propTypes.number.isRequired,
	rowsPerPage: propTypes.number.isRequired,
	base: propTypes.string.isRequired,
}

export default withStyles(styles)(Pagination);
