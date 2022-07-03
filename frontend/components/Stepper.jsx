export default props => (
	<div>
		<ul className={`stepper ${props.className ? props.className : ''}`} style={props.style}>
			{props.steps.map((s, i) => (
				<li className={`stepper-item ${i===(props.active-1) ? 'active' : ''}`} key={i}>
					<h4 className='h5 stepper-title'>
						{s.title}
					</h4>
					<div className='stepper-text'>
						{s.text}
					</div>
					{i < props.steps.length - 1 &&
						<span className='stepper-seperator'></span>
					}
				</li>
			))}
		</ul>
	</div>
);
