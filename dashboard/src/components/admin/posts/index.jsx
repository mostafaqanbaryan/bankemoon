import API from 'api';
import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import utils from 'utils';

// Elements
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import Title from 'components/title';
import AddButton from 'components/addbutton';
import EmptyList from 'components/emptyList';
import ErrorBoundary from 'components/errorBoundary';

const styles = theme => ({
	tableRow: {
		height: '96px',
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

const columnData = [
	{ id: 'select', noLabel: true, numeric: false, disablePadding: true, label: '' },
	{ id: 'title', numeric: false, disablePadding: true, label: 'عنوان پست' },
	{ id: 'updatedAt', hidden: 'md', numeric: false, disablePadding: false, label: 'آخرین ویرایش' },
	{ id: 'visits', hidden: 'md', numeric: false, disablePadding: false, label: 'بازدیدها' },
	{ id: 'comments', hidden: 'md', numeric: false, disablePadding: false, label: 'نظرات' },
];

class AdminPosts extends React.Component{
	state = {
		posts: null,
		error: null,
		total: 0,
		rowsPerPage: 10,
	};

	handleError = err => this.setState({ error: err.message });

	getPosts = () => {
		const key = 'posts';
		const url = `/admin/${key}`;
		const cb = {
			error: this.handleError,
			succeed: (result => {
				this.setState({
					posts: result.data.posts,
					total: result.data.total,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	componentDidMount = () => {
		this.API = new API();
		this.getPosts();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
		} = this.props;
		const {
			posts,
			error,
		} = this.state;

		const base = '/admin/posts';
		const currentPage = this.props.match.params.currentPage;

		return(
			<ErrorBoundary error={error} reload={this.getPosts}>
				<Paper>
					<Title
						padding
						label='مدیریت پست‌ها'
						currentPage={currentPage}
						button={ <AddButton to={`${base}/new/`} title='پست جدید' /> } />
					<EmptyList noShadow data={posts}>
						{posts && 
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
									{posts &&
										posts.map(n => {
											return (
												<TableRow
													className={classes.tableRow}
													hover
													role="link"
													tabIndex={-1}
													key={n.id}>
												<TableCell className={classes.hiddenSm} padding="checkbox">
													<Checkbox />
												</TableCell>
												<TableCell
													padding="checkbox">
													<Button
														color='secondary'
														component={Link}
														to={`${base}/${n.id}/`}
													>{n.title}
													</Button>
												</TableCell>
												<TableCell className={classes.hiddenXs} >{utils.Miladi2Shamsi(n.updated_at, 'jYYYY/jMM/jDD')}</TableCell>
												<TableCell className={classes.hiddenMd} numeric>{n.visit_count}</TableCell>
												<TableCell className={classes.hiddenMd} numeric>{n.comment_count}</TableCell>
												</TableRow>
											);
										})
									}
								</TableBody>
							</Table>
						}
					</EmptyList>
					{/*<Pagination
						total={total}
						rowsPerPage={rowsPerPage}
						currentPage={currentPage}
						base={base}
					/>*/}
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(AdminPosts);
