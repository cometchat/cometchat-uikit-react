/**
 * @class CustomView
 * @description to define error view if desired view is not generated
 * @param {String} loading
 * @param {String} empty
 * @param {String} error
 */
 class CustomView {
	constructor({loading = null, empty = null, error = null}) {
		this.loading = loading;
		this.empty = empty;
		this.error = error;
	}
}

export { CustomView };