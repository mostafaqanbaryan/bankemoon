import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import utils from 'utils';
import LogoLoading from 'components/loading/logo';

import Title from 'components/title';
import BadgeEnhancement from 'components/enhancement/badge';

// Elements
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Square from 'components/square';
import AddButton from 'components/addbutton';

// Colors
import Green from '@material-ui/core/colors/green';

const styles = theme => ({
	request: {
		height: '38px',
		width: '38px',
		background: Green.A700,
		'&:hover': {
			background: Green.A400
		}
	},
	avatar: {
		height: '64px',
		width: '64px'
	},
	tableRow: {
		height: '96px',
	},
	ltr: {
		direction: 'ltr',
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

const columnData = [
	// { id: 'avatar', hidden: 'sm', noLabel: true, numeric: false, disablePadding: true, label: '' },
	{ id: 'name', numeric: false, disablePadding: true, label: 'نام بانک' },
	{ id: 'balance', hidden: 'md', numeric: true, disablePadding: false, label: 'موجودی شما' },
	{ id: 'loanCount', hidden: 'xs', numeric: false, disablePadding: false, label: 'وام‌های تسویه شده' },
	{ id: 'action', numeric: false, disablePadding: true, label: '' },
];

class Banks extends Component{
	state = {
		order: 'desc',
		orderBy: 'createdAt',
		page: 0,
		rowsPerPage: 15,
		banks: null
	}

	getBanks = (userId, orderBy, order) => {
		const banks = [
			{
				id: 1,
				name: 'نام بانک اول به عنوان اولین بانک در تاریخ سامانه بانکمون در ایران و برترین مدیریت قرض‌الحسنه خانوادگی',
				userBalance: 500000,
				loan: {
					delayed: 1,
					completed: 1,
					all: 2,
				},
				avatar: 'https://api.adorable.io/avatars/face/eyes10/nose3/mouth1/f95',
				hidden: true
			},
			{
				id: 2,
				name: 'نام بانک',
				userBalance: 15000,
				loan: {
					delayed: 0,
					completed: 1,
					all: 2,
				},
				avatar: 'https://api.adorable.io/avatars/face/eyes10/nose3/mouth1/f95',
				hidden: true
			},
		];
		this.setState({ banks });
	}

	componentDidMount = () => {
		setTimeout(() => {
			const userId = 1;
			this.getBanks(
				userId,
				this.state.orderBy,
				this.state.order
			);
		}, 2000);
	}

	render(){
		const { classes } = this.props;
		const { banks, order, orderBy, page, rowsPerPage } = this.state;

		if(banks)
			return (
				<Paper>
					<Title padding label='بانک‌های من' help='/tutorial/'
						button={ <AddButton to='/bank/new/' title='بانک جدید' /> } />
					<Table>
						<TableHead>
							<TableRow>
								{columnData.map(column => {
									let className = [];
									className.push(column.center ? classes.textCenter : null);
									switch(column.hidden){
										case 'xs':
											className.push(classes.hiddenXs);
											break;
										case 'sm':
											className.push(classes.hiddenSm);
											break;
										case 'md':
											className.push(classes.hiddenMd);
											break;
										case 'lg':
											className.push(classes.hiddenLg);
											break;
										case 'xl':
											className.push(classes.hiddenXl);
											break;
										default:
											break;
									}
									return(
										<TableCell
											key={column.id}
											className={classNames(className)}
											numeric={column.numeric}
											padding={column.disablePadding ? 'checkbox' : 'default'}
										>
											{!column.noLabel &&
													column.label
											}
										</TableCell>
									);
								})}
							</TableRow>
						</TableHead>

						<TableBody>
							{banks.map(n => {
								return (
									<TableRow
										className={classes.tableRow}
										hover
										role="link"
										tabIndex={-1}
										key={n.id}>
										{ /*<TableCell className={classes.hiddenSm} padding="checkbox">
										<Avatar className={classes.avatar} src={n.avatar} alt={`نماد بانک ${n.name}`} />
									</TableCell>*/}
									<TableCell padding="checkbox">
										{n.name}
									</TableCell>
									<TableCell className={classes.hiddenMd} numeric>
										{utils.money(n.userBalance)} تومان
									</TableCell>
									<TableCell className={classNames(classes.hiddenXs, classes.ltr)}>
										{n.loan.completed} / {n.loan.all}
									</TableCell>
									<TableCell padding="checkbox">
										<BadgeEnhancement badgeContent={n.loan.delayed} color='secondary' timeout={1000}>
											<Button component={Link} to={`/bank/${n.id}/`} variant='raised' color='primary'>ورود</Button>
										</BadgeEnhancement>
									</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Paper>
			);
		else
			return(
				<div style={{ height: 'calc(100vh - 208px - 64px)' }}>
					<LogoLoading style={{ paddingTop: 'calc(50vh - 208px)' }} />
				</div>
			);
			/* return (
				<Paper>
					<Title padding label='درحال دریافت اطلاعات...' />
					<Table>
						<TableHead>
							<TableRow>
								{columnData.map(column => {
									let className = [];
									className.push(column.center ? classes.textCenter : null);
									switch(column.hidden){
										case 'xs':
											className.push(classes.hiddenXs);
											break;
										case 'sm':
											className.push(classes.hiddenSm);
											break;
										case 'md':
											className.push(classes.hiddenMd);
											break;
										case 'lg':
											className.push(classes.hiddenLg);
											break;
										case 'xl':
											className.push(classes.hiddenXl);
											break;
										default:
											break;
									}
									return(
										<TableCell
											key={column.id}
											className={classNames(className)}
											numeric={column.numeric}
											padding={column.disablePadding ? 'checkbox' : 'default'}
										>
											{!column.noLabel &&
													column.label
											}
										</TableCell>
									);
								})}
							</TableRow>
						</TableHead>

						<TableBody>
							{[...Array(8)].map((zero, i) => {
								return (
									<TableRow
										className={classes.tableRow}
										hover
										role="link"
										tabIndex={-1}
										key={i}>
										<TableCell padding="checkbox">
											<Square height={20} width={358} />
										</TableCell>
										<TableCell className={classes.hiddenMd} numeric>
											<Square height={20} width='80%' />
										</TableCell>
										<TableCell className={classNames(classes.hiddenXs)}>
											<Square height={20} width={30} />
										</TableCell>
										<TableCell padding="checkbox">
											<Square height={36} width={88} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Paper>
			); */
	}
}
export default withStyles(styles)(Banks);

