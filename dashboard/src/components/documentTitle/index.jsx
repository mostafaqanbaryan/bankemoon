import React from 'react';
import propTypes from 'prop-types';

class DocumentTitle extends React.Component{
	createTitle = array => {
		let title = '';
		// Add title and description
		if(!array) {
			array = [];
			array.push('بانکمون');
			array.push('توضیحات');
		}else{
			array.push('بانکمون');
		}

		// Create title
		for(let i = 0; i < array.length; i++){
			if(i > 0)
				title += ' | ';
			title += array[i];
		}
		return title;
	}

	setTitle = () => {
		let array = [];
		array.push(this.props.title);
		const page = this.props.currentPage || null;
		if(page)
			array.push(`صفحه ${page}`);
		const title = this.createTitle(array);
		document.title = title;
		document.description = "بانکمون یک سامانه‌ی اینترنتی برای مدیریت قرض‌الحسنه خانوادگی و فامیلی شماست که امکانات فوق‌العاده زیادی را در اختیار شما و اعضای قرض‌الحسنه‌ی شما قرار می‌دهد";
	}

	componentWillMount = () => {
		this.setTitle();
	}

	componentDidUpdate = () => {
		this.setTitle();
	}

	render(){
		return(this.props.children);

	}
}

DocumentTitle.propTypes = {
	title : propTypes.string.isRequired,
	description: propTypes.string,
};

export default DocumentTitle;

