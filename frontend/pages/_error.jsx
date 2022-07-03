import Page from '../components/Page';
import Error from '../components/Error';

export default class ErrorPage extends React.Component{
	static getInitialProps({ req, res, err }){
		const title = 'خطا';
		const description = 'توضیاحت مربوط به طراحی و ساخت سامانه اینترنتی مدیریت قرض الحسنه بانکمون توسط گروه برنامه نویسی اپیست';
		const canonical = req.originalUrl;

		return {
			structuredData: {},
			title,
			description,
			canonical,
			statusCode: res ? res.statusCode : err ? err.statusCode : null,
		};
	}

	render(){
		return(
			<Page className='text-center' hideTitle {...this.props}>
				<Error {...this.props} />
			</Page>
		);
	}
}

