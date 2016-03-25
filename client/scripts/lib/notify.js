/* global $ */

function notify(str, timeout = 3000) {
	const li = $('#emoji__notifications').$('<li>' + str + '</li>');
	if (timeout) setTimeout(function () {
		return li.remove();
	}, timeout);
	return li;
}

function warn(message, timeout) {
	notify(message, timeout).classList.add('warn');
}

function error(message, timeout) {
	notify(message, timeout).classList.add('error');
}

export {
	notify,
	warn,
	error
};
