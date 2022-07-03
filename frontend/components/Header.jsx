import Link from 'next/link';
import utils from '../utils';

export default props => (
	<header className='container position-relative header px-0'>
		<div className={`position-absolute d-flex text-sm-right justify-content-between w-sm-100 w-xs-100`}>
			<div>
				<Link href='/' as='/'>
					<a className='navbar-brand'>
						<img className='navbar-logo' alt='بانکمون' title='بانکمون' src={utils.cdn("/img/logo-white.svg")} />
						<h1 className='link-white h3 mr-3 d-inline align-middle'>بانکمون</h1>
					</a>
				</Link>
			</div>
			<nav className='navbar navbar-expand-lg position-static flex-row-reverse justify-content-between'>
				<div className='d-flex w-xs-100'>
					<div id='login' className={props.isGoUpVisible ? 'fixed' : ''}>
						<Link href='/portal/'>
							<a rel='index,follow' className='btn btn-success btn-block'>
								ورود به سامانه
							</a>
						</Link>
					</div>
					<button
						className='navbar-toggler'
						type='button'
						data-toggle='collapse'
						data-target='#header-navbar'
						aria-controls='header-navbar'
						aria-expanded='false'
						aria-label='باز و بسته کردن'>
						<i className='link-white fas fa-bars'></i>
					</button>
				</div>
				<div id='header-navbar' className='collapse navbar-collapse'>
					<ul className='navbar-nav mr-auto'>
						<li className='nav-item active'>
							<Link href='/' as='/'>
								<a rel='index,follow' className='nav-link link-white'>
									صفحه اصلی
								</a>
							</Link>
						</li>
						<li className='nav-item'>
							<Link href={{pathname: '/blog', query: {typeName: 'news'}}} as='/blog/news/'>
								<a rel='index,follow' className='nav-link link-white'>
									اخبار
								</a>
							</Link>
						</li>
						<li className='nav-item'>
							<Link href={{pathname: '/blog', query: {typeName: 'tutorials'}}} as='/blog/tutorials/'>
								<a rel='index,follow' className='nav-link link-white'>
									آموزش
								</a>
							</Link>
						</li>
						<li className='nav-item'>
							<Link href='/terms' as='/terms/'>
								<a rel='index,follow' className='nav-link link-white'>
									قوانین
								</a>
							</Link>
						</li>
						<li className='nav-item'>
							<Link href='/contact' as='/contact/'>
								<a rel='index,follow' className='nav-link link-white'>
									ارتباط با ما
								</a>
							</Link>
						</li>
						<li className='nav-item ml-2'>
							<Link href='/about' as='/about/'>
								<a rel='index,follow' className='nav-link link-white'>
									درباره
								</a>
							</Link>
						</li>
					</ul>
				</div>
			</nav>
		</div>
	</header>
);
