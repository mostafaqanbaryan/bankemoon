import API from 'api';
import md5 from 'md5';
import utils from '../utils';
import Page from 'components/Page';

function bankAvatar(avatar, username){
	if(avatar){
		return avatar;
	}else {
		const email = username + '@bankemoon.com';
		const hash = md5(email);
		return 'https://www.gravatar.com/avatar/' + hash + '?d=identicon';
	}
}
export default class Banks extends React.Component{
	static getInitialProps({ query }){
		if(typeof window === 'undefined' && query && query.secret){
			const key = 'banks';
			const url = `/bots/${key}/?secret=${query.secret}&page=${query.page}`;
			delete query.secret;
			const cb = {
				error: err => {
					if(err){
						err = new Error();
						err.code = 'ENOENT';
						throw err;
					}
				},
				succeed: result => {
					if(!result || !result.data.banks){
						const err = new Error();
						err.code = 'ENOENT';
						throw err;
					}
					const title = 'قرض الحسنه های بانکمون';
					const description = 'نمایش  تمامی قرض الحسنه های موجود در سامانه اینترنتی مدیریت قرض الحسنه فامیلی بانکمون';
					const canonical = query.page ? `/portal/page/${query.page}/` : `/portal/`;
					const itemListElement = result.data.banks.map((b, i) => {
						const bDesc = `قرض الحسنه‌ی ${b.name} با یوزر @${b.username} و تعداد اعضای ${b.user_count} در سامانه مدیریت  و بانکداری اینترنتی قرض الحسنه‌های خانوادگی و فامیلی بانکمون`;
						return {
							"@type": "ListItem",
							"position": query.page ? ((query.page-1) * result.data.rowsPerPage) + (i+1) : i+1,
							"item": {
								"@type": ["Organization", "CreativeWork"],
								"name": b.name,
								"legalName": b.name,
								"alternateName": b.username,
								"description": b.description || bDesc,
								"numberOfEmployees": b.user_count,
								"foundingDate": b.created_at,
								"telephone": `+98${b.phone}`,
								"founder": {
									"@type": "Person",
									"name": b.full_name
								},
								"funder": {
									"@type": "Person",
									"name": b.full_name
								},
								"member": {
									"@type": "Person",
									"name": b.full_name
								},
								"parentOrganization": {
									"@type": "Organization",
									"name" : "بانکمون"
								},
								"sponsor": {
									"@type": "Organization",
									"name" : "بانکمون"
								},
								"image": bankAvatar(b.avatar, b.username),
								"logo": bankAvatar(b.avatar, b.username),
								"url": `https://bankemoon.com/portal/@${b.username}/`,
								"mainEntityOfPage": {
									"@type": "WebPage",
									"@id": `https://bankemoon.com/portal/`
								},
								"isAccessibleForFree": "False",
								"hasPart": {
									"@type": "WebPageElement",
									"isAccessibleForFree": "False",
									"cssSelector": ".paywall"
								}
							},
						};
					});

					const structuredData = {
						'@context': 'http://schema.org',
						'@type': 'ItemList',
						numberOfItems: result.data.total,
						itemListElement,
					};
					return {
						banks: result.data.banks,
						total: result.data.total,
						rowsPerPage: result.data.rowsPerPage,
						page: query.page,
						title,
						description,
						canonical,
						structuredData,
					};
				}
			};
			const Api = new API();
			return API.Result(cb, Api.get({ url, key, serverSide: true }));
		}
		const err = new Error();
		err.code = 'ENOENT';
		throw err;
	}


	render(){
		const rowsPerPage = this.props.rowsPerPage;
		const total = this.props.total;
		const banks = this.props.banks;
		const pages = Math.ceil(total / rowsPerPage);
		const page = this.props.page ? parseInt(this.props.page) : 1;
		const prevPage = page-1 > 0 ? page-1 : 0;
		const nextPage = page+1 <= pages ? page+1 : 0;
		const base = '/portal';

		return(
			<Page
				error={this.props.error}
				title={this.props.title}
				description={this.props.description}
				canonical={this.props.canonical}
				structuredData={this.props.structuredData}>
				<p>{this.props.description}</p>

				<section>
					{banks.map(bank => {
						const href = `/portal/@${bank.username}/`;
						return(
							<div key={bank.id} className='border-bottom py-4 paywall' itemscope itemtype='http://schema.org/'>
								<div className='row align-items-center'>
									<div className='col-12 col-sm-3 text-center'>
										<a href={href} rel='index,nofollow'>
											<img src={bankAvatar(bank.avatar, bank.username)} alt={`${bank.username} Logo`} title={bank.name} />
										</a>
										<p className='small mb-0'>{utils.Miladi2Shamsi(bank.created_at, 'jYYYY/jMM/jDD')}</p>
										<p className='small'>اعضا: {bank.user_count} نفر</p>
									</div>
									<div className='col-12 col-sm-9 text-sm-right text-center'>
										<div>
											<a href={href} rel='index,nofollow'>
												<h3 className='mt-0'>{bank.name}</h3>
											</a>
										</div>
										<strong style={{ lineHeight: '2rem' }}>
											{bank.description
												? <p>
														bank.description
													</p>
												: <p><a href={href} rel='index,nofollow'>قرض الحسنه‌ی {bank.name}</a> با یوزر <a href={href} rel='index,nofollow'>@{bank.username}</a> و تعداد اعضای {bank.user_count} در سامانه <a rel='index,follow' href='/'>مدیریت  و بانکداری</a> <a rel='index,follow' href='/'>اینترنتی</a> <a rel='index,follow' href='/'>قرض الحسنه‌های خانوادگی و فامیلی</a> <a rel='index,follow' href='/'>بانکمون</a>
													</p>
											}
										</strong>
									</div>
								</div>
							</div>
						)}
					)}
				</section>

				<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
					<p>
						{prevPage > 0 &&
							<a href={`${base}/page/${prevPage}/`} rel='index, follow'>Previous Page</a>
						}
					</p>
					<p>
						{nextPage > 0 &&
							<a href={`${base}/page/${nextPage}/`} rel='index, follow'>Next Page</a>
						}
					</p>
				</div>
			</Page>
		);
	}
}


