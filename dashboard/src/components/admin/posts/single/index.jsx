import API from 'api';
import React from 'react';
import utils from 'utils';
import WYSIWYG from 'react-rte';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';

import Title from 'components/title';
import EmptyList from 'components/emptyList';
import ErrorBoundary from 'components/errorBoundary';
import FormValidation from 'components/formvalidation';

import AcceptIcon from '@material-ui/icons/CheckCircle';
import DeclineIcon from '@material-ui/icons/Cancel';

class AdminPost extends React.Component{
	state = {
		error: null,
		uploadLoading: false,
		post: {
			title: '',
			slug: '',
			excert: '',
			content: WYSIWYG.createEmptyValue(),
			picture_id: null,
			picture_path: '',
			picture_alt: '',
			picture_title: '',
			category: [],
		},
		comments: null
	}

	handleError = err => this.setState({ error: err.message });

	handleChange = name => e => {
		let value = e.target.value;
		let post = this.state.post;
		post[name] = value;
		this.setState({ post });
	};

	handleChangeWYSIWYG = value => {
		let post = this.state.post;
		post.content = value;
		this.setState({ post });
	};

	getPost = postId => {
		const key = 'posts';
		const url = `/admin/${key}/${postId}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				const post = result.data.post;
				post.content = WYSIWYG.createValueFromString(post.content, 'html');
				this.setState({ post });
			}
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	handleSubmit = e => {
		const postId = this.props.match.params.postId;
		const formData = new FormData(e.currentTarget);
		formData.set('content', this.state.post.content.toString('html'));
		const key = 'addPost';
		const url = postId > 0 ? `/admin/posts/${postId}` : `/admin/posts/`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.props.history.push('/admin/posts/');
			}
		};
		if(postId > 0)
			API.Result(cb, this.API.patch({ url, key, formData }));
		else
			API.Result(cb, this.API.post({ url, key, formData }));
	};

	handleUploadPicture = e  => {
		if(this.uploadInput.files.length <= 0)
			return;
		if(!this.state.post.picture_alt || !this.state.post.picture_title)
			return this.setState({ error: 'متن جایگزین و عنوان را وارد کنید' });
		this.setState({ uploadLoading: true });
		const file = this.uploadInput.files[0];
		const image = new Image();
		image.onload = () => {
			// Check size
			if(file.size > 256*1024){
				return this.handleError(new Error('حداکثر حجم مجاز 256 کیلوبایت است'));
			}
			const formData = new FormData();
			formData.append('alt', this.state.post.picture_alt);
			formData.append('title', this.state.post.picture_title);
			const key = 'picture';
			const url = `/admin/${key}`;
			const cb = {
				error: this.handleError,
				succeed: result => {
					const post = this.state.post;
					post.picture_path = result.data.path;
					post.picture_id = result.data.id;
					this.setState({
						uploadLoading: false,
						post
					});
				}
			};
			API.Result(cb, this.API.file({ url, key, file, formData }));
		};
		image.onerror = () => {
			this.handleError(new Error('عکس انتخاب شده معتبر نیست'));
		};
		image.src = URL.createObjectURL(file);
	};

	handleDeletePicture = e  => {
		this.setState({ uploadLoading: true });
		const pictureId = this.state.post.picture_id;
		const key = 'picture';
		const url = `/admin/${key}/${pictureId}`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				const post = this.state.post;
				post.picture_path = '';
				post.picture_alt = '';
				post.picture_title = '';
				post.picture_id = null;
				this.setState({
					uploadLoading: false,
					post
				});
			}
		};
		API.Result(cb, this.API.delete({ url, key }));
	};

	handleAcceptComment = commentId => e => {

	};

	handleDeclineComment = commentId => e => {

	};

	componentDidMount = () => {
		this.API = new API();
		const postId = this.props.match.params.postId;
		if(postId >= 0)
			this.getPost(postId);
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			categories,
		} = this.props;
		const {
			post,
			error,
			comments,
		} = this.state;

		return(
			<ErrorBoundary error={error} reload={() => this.setState({ error: null })}>
				<Paper style={{ padding: 16 }}>
					<Title
						label={`ویرایش  "${post.title}"`}
						back='/admin/posts/'
					/>
					<FormValidation onSubmit={this.handleSubmit}>
						<TextField
							required
							fullWidth
							id='title'
							name='title'
							label='عنوان پست'
							helperText='عنوان را وارد کنید'
							margin='normal'
							onChange={this.handleChange('title')}
							value={post.title}
							InputLabelProps={{
								style: {fontSize: '1.5em'}
							}}
							inputProps={{
								style: {fontSize: '1.5em'}
							}}
						/>
						<TextField
							fullWidth
							required
							id='slug'
							name='slug'
							label='نامک پست'
							helperText='نامک را وارد کنید'
							margin='normal'
							onChange={this.handleChange('slug')}
							value={utils.sanitize.title(post.slug)}
							InputLabelProps={{
								style: {fontSize: '0.8em'}
							}}
							inputProps={{
								style: {fontSize: '0.8em'}
							}}
						/>

						<TextField
							fullWidth
							select
							required
							name='category'
							helperText='دسته را انتخاب کنید'
							label='دسته‌بندی'
							margin='normal'
							onChange={this.handleChange('category')}
							SelectProps={{
								multiple: true,
							}}
							value={post.category}>
							{Object.keys(categories).map(key => (
								<MenuItem
									key={key}
									value={key}>
									{categories[key]}
								</MenuItem>
							))}
						</TextField>

						<Grid container spacing={8}>
							<Grid item md={5}>
								<TextField
									fullWidth
									label='متن جایگزین'
									value={post.picture_alt}
									onChange={this.handleChange('picture_alt')}
								/>
							</Grid>

							<Grid item md={5}>
								<TextField
									fullWidth
									label='عنوان تصویر'
									value={post.picture_title}
									onChange={this.handleChange('picture_title')}
								/>
							</Grid>

							<Grid item md={2} style={{ alignSelf: 'flex-end' }}>
								{post && post.picture_id
									? <Button
											fullWidth
											color='secondary'
											onClick={this.handleDeletePicture}
											disabled={this.state.uploadLoading}
											component='span'>
											حذف عکس
										</Button>
									: <label htmlFor="uploadImage">
											<Button
												fullWidth
												disabled={this.state.uploadLoading}
												component='span'>
												انتخاب عکس
											</Button>
										</label>
								}
							</Grid>
						</Grid>
						<div>
							{post && post.picture_path &&
								<img
									style={{ width: '100%' }}
									src={utils.cdn(post.picture_path)}
									alt={post.picture_alt}
									title={post.picture_title}
								/>
							}
						</div>
						<input
							type='hidden'
							name='picture_id'
							value={post.picture_id}
						/>

						<TextField
							multiline
							fullWidth
							required
							helperText='خلاصه خالی باشد'
							rows={5}
							name='excert'
							label='خلاصه'
							margin='normal'
							onChange={this.handleChange('excert')}
							value={post.excert}
							inputProps={{
								maxlength: 150,
								minlength: 70,
							}}
						/>
					{/*<TextField
							multiline
							fullWidth
							required
							helperText='متن نباید خالی باشد'
							rows={5}
							id='content'
							name='content'
							label='متن پست'
							margin='normal'
							onChange={this.handleChange('content')}
							value={post.content}
						/>*/}
						<WYSIWYG
							value={post.content}
							onChange={this.handleChangeWYSIWYG}
						/>

						<div>
							<Button
								fullWidth
								type='submit'
								color="primary">ارسال</Button>
						</div>
					</FormValidation>
					<input
						id="uploadImage"
						type="file"
						accept="image/jpeg"
						name="uploadImage"
						ref={ref => this.uploadInput = ref}
						onChange={this.handleUploadPicture}
						style={{display: 'none'}} />

					{comments
						? <List>
								{post.comments.map(comment => (
									<ListItem
										key={comment.id}>
										<Button>{comment.author.fullName}</Button>
										<Typography>{comment.content}</Typography>
										<div>
											<IconButton
												color='primary'
												onClick={this.handleAcceptComment(comment.id)}>
												<AcceptIcon />
											</IconButton>
											<IconButton
												color='secondary'
												onClick={this.handleDeclineComment(comment.id)}>
												<DeclineIcon />
											</IconButton>
										</div>
									</ListItem>
								))}
							</List>
						: <EmptyList data={comments} />
					}
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default AdminPost;
