'use strict';

function handleClick (e, startTime, fn, subGrid) {

	if (Date.now() - startTime < 200) {
		subGrid.fire('emojiSelect', {emoji: subGrid.dataset.emoji});
	} else {
		if (event.changedTouches) {
			const changedTouch = event.changedTouches[0];
			const elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
			subGrid.fire('emojiSelect', {emoji: elem.dataset.emoji});
		} else {
			subGrid.fire('emojiSelect', {emoji: e.target.dataset.emoji});
		}
	};

	e.currentTarget.off('mouseup', fn);
	e.currentTarget.off('touchend', fn);
	clickUp();
}

function clickUp () {
	$$('.expand').forEach(el => {
		el.classList.remove('expand');
		el.off('mouseup', handleClick);
		el.off('touchend', handleClick);
	});
}

export default function selectablePopup(subGrid) {

	function triggerBox (e) {
		e.preventDefault();
		e.stopPropagation();

		const startTime = Date.now();
		subGrid.classList.add('expand');
		function handleProxy(e) {
			handleClick(e, startTime, handleProxy, subGrid);
		}
		document.on('mouseup', handleProxy);
		document.on('touchend', handleProxy);
	}

	subGrid.parentNode.on('mousedown', triggerBox, true);
	subGrid.parentNode.on('touchstart', triggerBox, true);
	subGrid.parentNode.on('touchcancel', () => clickUp());
	subGrid.classList.add('emoji__sub-grid');
}
