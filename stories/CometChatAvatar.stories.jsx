import React from 'react';

import {CometChatAvatar} from "../src/components";

const image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8r9te0aQZe9O5cFBJ53Jl7-JselY4fdEvdg&usqp=CAU";
const name = "Priyadarshini";

export default {
  title: 'UI Kit/Shared/Secondary Components/CometChatAvatar',
  component: CometChatAvatar,
  argTypes: {
  },
};

const Template = args => <CometChatAvatar {...args} />;

export const Circle = Template.bind({});
Circle.args = {
	width: "70px",
	height: "70px",
	image: image,
	borderRadius: "50%",
};

export const Square = Template.bind({});
Square.args = {
	width: "70px",
	height: "70px",
	image: image,
	borderRadius: "20px",
};

export const WithName = Template.bind({});
WithName.args = {
	width: "70px",
	height: "70px",
	name: name,
	borderRadius: "50%",
	backgroundColor: "#39f",
	textColor: "#fff",
	textFont: "700 50px Inter,sans-serif",
};

export const WithOuterview = Template.bind({});
WithOuterview.args = {
	width: "70px",
	height: "70px",
	image: image,
	borderRadius: "20px",
	outerView: "2px solid blue",
	outerViewSpacing: "4px",
};