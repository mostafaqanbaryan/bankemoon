import Head from 'next/head';
import utils from '../utils';

export default props => {
	const title = props.stripTitle ? props.title : `${props.title} | بانکمون`;
	const keywords = (props && props.structuredData && props.structuredData.keywords) || 'مدیریت قرض الحسنه,قرض الحسنه فامیلی,قرض الحسنه خانوادگی,قرض الحسنه فامیلی موبایل,قرض الحسنه فامیلی اندروید,قرض الحسنه فامیلی آیفون,قرض الحسنه فامیلی اینترنتی';
	return (
		<Head>
			<title>{title}</title>
			<meta key='title' name="title" content={title} />
			<meta key='description' name="description" content={props.description} />
			<meta key='keywords' name='keywords' content={keywords} />
			<link key='canonical' rel='canonical' href={`https://bankemoon.com${props.canonical}`} />

			{/* TWITTER */}
			<meta name="twitter:card" content={props.description} />
			<meta name="twitter:site" content="@bankemoon" />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={props.description} />
			<meta name="twitter:creator" content="@bankemoon" />
			<meta name="twitter:image" content={utils.cdn('/img/og-image.jpg')} />

			{/*FACE BOOK*/}
			<meta property="og:image" content={utils.cdn('/img/og-image.jpg')} />
			<meta property="og:image:width" content="1383" />
			<meta property="og:image:height" content="724" />
			<meta property="og:site_name" content="بانکمون" />
			<meta property="og:title" content={title} />
			<meta property="og:type" content="website" />
			<meta property="og:description" content={props.description} />
			<meta property="og:url" content={`https://bankemoon.com${props.canonical}`} />

			{props.structuredData && Object.keys(props.structuredData).length > 0 &&
				<script key='structuredData' type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(props.structuredData) }}></script>
			}
		</Head>
	);
}
