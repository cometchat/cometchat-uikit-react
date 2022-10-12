import { InputData } from "./InputData";

class ConversationInputData extends InputData {
	constructor({
		id,
		thumbnail,
		status,
		title,
		subtitle,
		unreadCount,
		timestamp,
		readreceipt,
	}) {
		super({ id, thumbnail, status, title, subtitle });
		this.unreadCount = unreadCount;
		this.timestamp = timestamp;
		this.readreceipt = readreceipt;
	}
}
export { ConversationInputData };
