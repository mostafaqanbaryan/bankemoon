import Link from 'next/link';
import Meta from './Meta';

export default props => (
	<div className='text-center'>
		<Meta
			title={'خطای ' + (props.error ? props.error.code : '404')}
			description={props.error ? props.error.message : 'یافت نشد'}
			canonical={props.error ? props.error.code : '404'}
		/>
		<h3 style={{ fontSize: '8rem', fontWeight: 400 }}>{props.error ? props.error.code : 404}</h3>
		<p>{props.statusCode === 404 ? 'صفحه مورد نظر پیدا نشد' : props.error ? props.error.message : 'ارتباط با سرور برقرار نشد'}</p>

		<div className='d-flex justify-content-around' style={{ marginTop: '6rem' }}>
			<Link href='/portal/'>
				<a rel='index,follow'>
					ورود به سامانه
				</a>
			</Link>

			<Link href='/' as='/'>
				<a  rel='index,follow'>
					صفحه اصلی
				</a>
			</Link>

			<Link href={{pathname: '/blog', query: {typeName: 'news'}}} as='/blog/news/'>
				<a rel='index,follow'>
					اخبار
				</a>
			</Link>

			<Link href={{pathname: '/blog', query: {typeName: 'tutorials'}}} as='/blog/tutorials/'>
				<a rel='index,follow'>
					آموزش
				</a>
			</Link>

			<Link href='/terms' as='/terms/'>
				<a rel='index,follow'>
					قوانین
				</a>
			</Link>

			<Link href='/contact' as='/contact/'>
				<a rel='index,follow'>
					ارتباط با ما
				</a>
			</Link>

			<Link href='/about' as='/about/'>
				<a rel='index,follow'>
					درباره
				</a>
			</Link>
		</div>
	</div>
);
