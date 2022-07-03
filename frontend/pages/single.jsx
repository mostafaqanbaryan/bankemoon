import API from 'api';
import HtmlParser from 'react-html-parser';
import Link from 'next/link';
import Tag from 'components/Tag';
import Page from 'components/Page';
import utils from 'utils';

export default class Single extends React.Component{
	static getInitialProps({ query }){
		const key = 'posts';
		const url = `/${key}/${query.postName}`;
		const cb = {
			error: err => {
				return {
					error: err,
				};
			},
			succeed: result => {
				const post = result.data.post;
				const title = post.title;
				const canonical = `/blog/${query.typeName}/${query.postName}/`;
				const description = post.excert;
				const structuredData = {
					"@context": "http://schema.org",
					"@type": "BlogPosting",
					"author": {
						"@type": "Organization",
						"name": "بانکمون"
					},
					"publisher": {
						"@type": "Organization",
						"name": "بانکمون",
						"logo": {
							"@type": "ImageObject",
							"height": "49",
							"width": "72",
							"url": utils.cdn('/img/logo.png')
						}
					},
					"dateModified": post.updated_at,
					"datePublished": post.created_at,
					"headline": post.title,
					"image": utils.cdn(post.picture),
					"articleBody": post.excert,
					"articleSection": post.category,
					"mainEntityOfPage": {
						"@type": "WebPage",
						"@id": `https://bankemoon.com/blog/${query.typeName}/`
					}
				};
				return {
					title,
					canonical,
					description,
					structuredData,
					post,
					typeName: query.typeName,
				};
			}
		};
		const Api = new API();
		return API.Result(cb, Api.get({ url, key, serverSide: true }));
	};

	state = {
		error: null,
		errorGetComment: null,
		commentSent: false,
		comments: null,
	};

	handleError = err => this.setState({ error: err.message, commentSent: false, });

	handleErrorGetComment = err => this.setState({ errorGetComment: err.message });

	getComments = postId => {
		const key = 'posts';
		const url = `/${key}/${this.props.post.id}/comments`;
		const cb = {
			error: this.handleErrorGetComment,
			succeed: result => {
				this.setState({
					error: null,
					comments: result.data.comments
				});
			}
		};
		return API.Result(cb, this.API.get({ url, key }));
	};

	handleCommentSubmit = e => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const key = 'posts';
		const url = `/${key}/${this.props.post.id}/comments`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					error: null,
					commentSent: true,
				});
			}
		};
		return API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentDidMount = () => {
		this.API = new API();
		if(this.props.post && !this.props.post.comment_lock)
			this.getComments(this.props.post.id);
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const post = this.props.post;
		const comments = this.state.comments;
		const href = post ? { pathname: '/single', query: { typeName: this.props.typeName, postName: post.slug }} : '/blog';
		const as = post ? `/blog/${this.props.typeName}/${post.slug}/` : '/blog/';

		return(
			<Page
				hideTitle
				error={this.props.error}
				title={this.props.title}
				description={this.props.description}
				canonical={this.props.canonical}
				structuredData={this.props.structuredData}>
				{post &&
					<div>
						{post.picture &&
							<div >
								<Link href={href} as={as}>
									<a rel="index,follow">
										<img className='w-100 shadow mb-2' src={utils.cdn(post.picture)}  alt={post.picture_alt} title={post.picture_title} />
									</a>
								</Link>
							</div>
						}
						<h2 className='my-3'>{post.title}</h2>
						<div className='row small mb-3'>
							<p className='col-6 col-sm-2 col-md-1 text-secondary'>
								<i className='fas fa-eye'></i>
								<span className='mr-1'>{post.visit_count || 0}</span>
							</p>
							<p className='col-6 col-sm-2 col-md-1 text-secondary'>
								<i className='fas fa-comment'></i>
								<span className='mr-1'>{post.comment_count || 0}</span>
							</p>

							<p className='col-6 col-sm-4 col-md-2 text-secondary'>
								{utils.Miladi2Shamsi(post.created_at, 'jYYYY/jMM/jDD')}
							</p>

							<p className='col-6 col-sm-4 col-md-2'>
								<Link
									href={{ pathname: '/blog', query:{ typeName: post.category.toLowerCase() }}}
									as={`/blog/${post.category.toLowerCase()}/`}>
									<a>
										{post.category === 'Tutorials' ? 'آموزش' : 'خبر'}
									</a>
								</Link>
							</p>
						</div>

						<section>
							{HtmlParser(post.content)}
						</section>

						{!post.comment_lock &&
							<section className='border-top pt-5 mt-5'>
								<h3 className='mt-0'>ارسال نظر</h3>
								<form onSubmit={this.handleCommentSubmit}>
									<div className='form-group'>
										<label htmlFor='fullname'>نام و نام خانوادگی</label>
										<input className='form-control' type='text' id='fullname' name='fullname' required />
									</div>

									<div className='form-group'>
										<label htmlFor='email'>ایمیل</label>
										<input className='form-control' type='email' id='email' name='email' required />
									</div>

									<div className='form-group'>
										<label htmlFor='content'>متن پیام</label>
										<textarea className='form-control' type='text' id='content' name='content' required></textarea>
									</div>

									{(this.state.error || this.state.commentSent) &&
										<div className='text-center'>
											{this.state.error &&
												<p className='text-danger' style={{ whiteSpace: 'pre-line' }}>
													{this.state.error}
												</p>
											}
											{this.state.commentSent &&
												<p className='text-success'>
													نظر شما ارسل شد و پس  تایید قابل مشاهده است
												</p>
											}
										</div>
									}

									<div className='text-left'>
										<button className='btn btn-primary' type='submit'>
											ارسال
										</button>
									</div>
								</form>
							</section>
						}

						{comments &&
							<section className='border-top pt-5 mt-5'>
								<h3 className='mt-0 mb-5'>نظرات کاربران</h3>
								<div>
									{comments.length > 0
										? comments.map((comment, i) => (
												<div key={comment.id} className={i+1 < comments.length ? 'border-bottom mb-3' : ''}>
													<p className='h6 d-inline-block'>{comment.fullname} گفته که:</p>
													<small className='pr-3 secondary-text'>({utils.Miladi2Shamsi(comment.created_at, 'jYYYY/jMM/jDD')})</small>
													<p className='pr-3'>{comment.content}</p>
												</div>
										))
										: <p className='text-center h2 my-5' style={{ fontWeight: 200, color: '#ccc' }}>نظری وجود ندارد</p>
									}
								</div>
							</section>
						}
						{this.state.errorGetComment &&
							<div className='text-center'>
								<p className='text-danger' style={{ whiteSpace: 'pre-line' }}>
									دریافت نظرات انجام نشد<br/>
									{this.state.errorGetComment}
								</p>
							</div>
						}
					</div>
				}
			</Page>
		);
	}
}


