import API from 'api';
import Link from 'next/link';
import Tag from 'components/Tag';
import Page from 'components/Page';
import utils from 'utils';

export default class Blog extends React.Component{
	static getInitialProps({ res, query }){
		const key = 'posts';
		const page = query.page || 1;
		const url = `/${key}/?type=${query.typeName}&page=${page}`;
		const cb = {
			error: err => {
				return {
					error: err
				};
			},
			succeed: result => {
				const itemLists = result.data.posts.map((p, i) => {
					return {
						"@type": "ListItem",
						"position": query.page ? ((query.page-1) * result.data.rowsPerPage) + (i+1) : i+1,
						"item": {
							"name": p.title,
							"alternateName": p.slug,
							"description": p.excert,
							"image": utils.cdn(p.picture),
							"url": `https://bankemoon.com/blog/${query.typeName}/${p.slug}/`,
							"mainEntityOfPage": {
								"@type": "WebPage",
								"@id": `https://bankemoon.com/blog/${query.typeName}/`
							}
						}
					};
				});
				const isTutorial = query.typeName === 'tutorials';
				const title = isTutorial ? 'آموزش‌ها' : 'خبر‌ها';
				const description = isTutorial
					? 'آموزش های موردنیاز برای مدیریت کامل قرض الحسنه و استفاده از تمامی امکانات سامانه اینترنتی مدیریت قرض الحسنه فامیلی بانکمون'
					: 'خبرهای مرتبط با ارتقا و بروزرسانی های سامانه اینترنتی مدیریت قرض الحسنه فامیلی و خانوادگی بانکمون';
				const canonical = `/blog/${query.typeName}/`;
				return {
					title,
					description,
					canonical,
					posts: result.data.posts,
					total: result.data.total,
					rowsPerPage: result.data.rowsPerPage,
					page: query.page ? parseInt(query.page) : 1,
					typeName: query.typeName,
					structuredData: {
								"@context": "http://schema.org",
								"@type": "ItemList",
								"numberOfItems": result.data.total,
								"itemListElement": itemLists
							}
				};
			}
		};
		const Api = new API();
		return API.Result(cb, Api.get({ url, key, serverSide: true }));
	};

	render(){
		const category = this.props.typeName === 'tutorials' ? 'آموزش‌ها' : 'خبر‌ها';
		const total = this.props.total;
		const base = `/blog`;
		const page = this.props.page || 1;
		const rowsPerPage = 1;
		const lastPage = Math.ceil(total / rowsPerPage);
		const prevPage = {
			href: {pathname: base, query: {typeName: this.props.typeName, page: page-1}},
			as: page-1 === 1 ? `${base}/${this.props.typeName}/` : `${base}/${this.props.typeName}/page/${page-1}/`
		};
		const nextPage = {
			href: {pathname: base, query: {typeName: this.props.typeName, page: page+1}},
			as: `${base}/${this.props.typeName}/page/${page+1}/`
		};

		return(
			<Page
				error={this.props.error}
				title={this.props.title}
				description={this.props.description}
				structuredData={this.props.structuredData}
				canonical={this.props.canonical}>
				<section>
					{this.props.posts && this.props.posts.map(post => {
						const href = { pathname: '/single', query: { typeName: this.props.typeName, postName: post.slug }};
						const as = `/blog/${this.props.typeName}/${post.slug}/`;
						return(
							<div key={post.id} className='border-bottom mt-5'>
								{post.picture &&
									<div>
										<Link href={href} as={as}>
											<a rel="index,follow">
												<img className='w-100 shadow mb-2' src={utils.cdn(post.picture)} alt={post.picture_alt} title={post.picture_title} />
											</a>
										</Link>
									</div>
								}

								<div>
									<Link href={href} as={as}>
										<a rel="index,follow">
											<h3 className='mt-2'>{post.title}</h3>
										</a>
									</Link>

									<div className='row small'>
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
									<p>
										{post.excert}
									</p>
								</div>
							</div>
						)}
					)}
					<div className={`d-flex mt-3 ${page > 1 ? 'justify-content-between' : 'justify-content-end'}`}>
						{page > 1 && 
							<Link href={prevPage.href} as={prevPage.as}>
								<a className='btn btn-primary'>
									صفحه قبل
								</a>
							</Link>
						}

						{page < lastPage &&
								<div>
							<Link href={nextPage.href} as={nextPage.as}>
								<a className='btn btn-primary'>
									صفحه بعد
								</a>
							</Link>
						</div>
						}
					</div>
				</section>
			</Page>
		);
	}
}

