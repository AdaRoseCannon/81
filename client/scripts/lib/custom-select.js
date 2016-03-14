/* global TweenLite, Back, Draggable */

// turn a list into a select.
function customSelect (el, boundaryEl) {
	el.classList.add('custom-ul-select');
	let open = false;

	const defaultItem = el.$(':scope > li[data-selected]');
	if (defaultItem) {
		el.dataset.value = defaultItem.dataset.value;
	} else {
		const firstItem = el.$(':scope > li');
		firstItem.dataset.selected = true;
		el.dataset.value = firstItem.dataset.value;
	}

	function expand(e) {
		open = true;
		el.classList.add('expanded');
		e.preventDefault();
		e.stopImmediatePropagation();
	}

	function close(e) {
		open = false;
		el.classList.remove('expanded');
		TweenLite.to(el, 0.45, {ease: Back.easeOut, y: 0});

		if (!e) {
			return;
		};
		e.preventDefault();
		e.stopImmediatePropagation();

		const li = e.target;
		const items = el.$$(':scope > li');
		if (items.indexOf(li) === -1) {
			return;
		}
		items.forEach(li => {
			delete li.dataset.selected;
		});
		li.dataset.selected = true;
		el.dataset.value = li.dataset.value;
		el.fire('change', {
			value: li.dataset.value
		});
	}

	el.on('close', () => close());
	el.on('click', e => open ? close(e) : expand(e));


	Draggable.create(el, {
		type:'y',
		bounds: boundaryEl || el.parentNode,
		edgeResistance:0.65,
		onDragEnd: function () {
			if (!open) TweenLite.to(el, 0.45, {ease: Back.easeOut, y: 0});
		}
	});
}

export default customSelect;
