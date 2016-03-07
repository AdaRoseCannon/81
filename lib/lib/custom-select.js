'use strict';

// turn a list into a select.
function customSelect (el) {
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

		if (!e) {
			return;
		};
		e.preventDefault();
		e.stopImmediatePropagation();

		el.$$(':scope > li').forEach(li => {
			delete li.dataset.selected;
		});

		const li = e.target;
		li.dataset.selected = true;
		el.dataset.value = li.dataset.value;
		el.fire('change', {
			value: li.dataset.value
		});
	}

	document.body.on('click', () => close());
	el.on('click', e => open ? close(e) : expand(e));
}

export default customSelect;
