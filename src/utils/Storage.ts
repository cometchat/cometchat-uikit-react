import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";

/**
 * Utility class for managing local storage with change detection capabilities.
 * It is used in CometChatIncomingCall component.
 */
export class StorageUtils {
	private static isWindowListenerAttached = false;
	private static storageKeyToRemove: string | null = null;

	private static handleBeforeUnload = () => {
		if (this.storageKeyToRemove) {
			StorageUtils.removeItem(this.storageKeyToRemove);
			if (this.isWindowListenerAttached) {
				window.removeEventListener("beforeunload", this.handleBeforeUnload);
				this.isWindowListenerAttached = false;
				this.storageKeyToRemove = "";
			}
		}
	};
	/**
	 * Attaches a callback function to the `storage` event, which is triggered when storage changes occur.
	 * @param {EventListenerOrEventListenerObject} callback - The function to be called when the storage event is fired. This function will receive the storage event as an argument.
	 */
	static attachChangeDetection = (callback: EventListenerOrEventListenerObject) => {
		window.addEventListener("storage", callback);
		if (!this.isWindowListenerAttached) {
			window.addEventListener("beforeunload", this.handleBeforeUnload);
			this.isWindowListenerAttached = true;
		}
	};

	/**
	 * Detaches a previously attached callback function from the `storage` event.
	 * @param {EventListenerOrEventListenerObject} callback - The function that was previously attached to the storage event. This function will be removed from the event listeners.
	 */
	static detachChangeDetection = (callback: EventListenerOrEventListenerObject) => {
		window.removeEventListener("storage", callback);
	};

	/**
	 * Stores a value in local storage under the specified key.
	 * @param {string} storageKey - The key under which the value will be stored.
	 * @param {string} storageValue - The value to be stored in local storage. It will be converted to a JSON string.
	 */
	static setItem = (storageKey: string, storageValue: string | CometChat.Call) => {
		localStorage.setItem(storageKey, JSON.stringify(storageValue));
		if(!this.storageKeyToRemove && storageKey == CometChatUIKitConstants.calls.activecall){
			this.storageKeyToRemove = CometChatUIKitConstants.calls.activecall;
		}
	};

	/**
	 * Retrieves a value from local storage by its key.
	 * @param {string} storageKey - The key of the item to be retrieved from local storage.
	 * @returns {string} The value stored in local storage under the specified key, parsed from JSON. Returns `null` if the key does not exist.
	 */
	static getItem = (storageKey: string) => {
		return JSON.parse(localStorage.getItem(storageKey)!);
	};

	/**
	 * Removes an item from local storage by its key.
	 * @param {string} storageKey - The key of the item to be removed from local storage.
	 */
	static removeItem = (storageKey: string) => {
		localStorage.removeItem(storageKey);
	};
}