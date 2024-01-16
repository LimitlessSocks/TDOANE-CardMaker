define(["react", "react-class"], function(React, ReactClass){
	return function(props)
	{
		return React.createElement(
			"label",
			{
				className: "ipsCustomInput"
			},
			React.createElement("div",
				{
					className: "input-centerer",
				},
				React.createElement("input", {
					id: props.id,
					onChange: props.onChange,
					type: "checkbox",
					checked: props.checked,
				}),
			)
		);
	}
});