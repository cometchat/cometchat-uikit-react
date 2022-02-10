class CometChatMessageTemplate {
    
	category = "";
	type = "";
	icon = "";
	name = "";
	title = "";
	description = "";
	actionCallback = null;
	customView = null;
	options = [];

	constructor(...args) {

		if (typeof args !== "object") {
			return false;
		}

		this.category = args[0].category;
		this.type = args[0].type;
		this.icon = args[0].icon;
		this.name = args[0].name;
		this.title = args[0].title;
		this.description = args[0].description;
		this.actionCallback = args[0].actionCallback;
		this.customView = args[0].customView;
		this.options = args[0].options;
	}
}

export { CometChatMessageTemplate };