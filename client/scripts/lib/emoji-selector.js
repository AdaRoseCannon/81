/*global $, $$*/

function handleClick (e, duration, fn, subGrid) {

	if (duration < 200) {
		subGrid.fire('emojiSelect', {emoji: subGrid.dataset.emoji});
	} else {
		let event;
		if (e.changedTouches) {
			event = event.changedTouches[0];
		} else {
			event = e;
		}
		const elem = document.elementFromPoint(event.clientX, event.clientY);
		if (elem.dataset.emoji) subGrid.fire('emojiSelect', {emoji: elem.dataset.emoji});
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

		$('#emoji__text-input-focsable').focus();

		e.preventDefault();
		e.stopPropagation();

		const startTime = Date.now();
		subGrid.classList.add('expand');
		function handleProxy(e) {
			handleClick(e, (Date.now() - startTime), handleProxy, subGrid);
		}
		document.on('mouseup', handleProxy);
		document.on('touchend', handleProxy);
	}

	subGrid.parentNode.on('mousedown', triggerBox, true);
	subGrid.parentNode.on('touchstart', triggerBox, true);
	subGrid.parentNode.on('touchcancel', () => clickUp());
	subGrid.classList.add('emoji__sub-grid');
}
