'use strict';

// turn a list into a select.
function customSelect (el) {
	el.classList.add('custom-ul-select');
	const index = (el.$(':scope > li[data-selected]') || el.$(':scope > li')).prevAll().length;
	let open = false;

	function expand(e) {

		open = true;
		el.$$(':scope > li').forEach(li => li.style.display = 'list-item');
		el.classList.add('expanded');
		e.preventDefault();
		e.stopImmediatePropagation();
	}

	function close(e) {
		open = false;
		el.classList.remove('expanded');
		if (!e) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		el.$$(':scope > li').forEach(li => {
			if (li === e.target) {
				li.style.display = 'list-item';
				li.dataset.selected = true;
				el.dataset.value = li.dataset.value;
				el.fire('change', {
					value: li.dataset.value
				});
			} else {
				li.style.display = 'none';
				delete li.dataset.selected;
			}
		});
	}

	document.body.on('click', () => close());
	el.on('click', e => open ? close(e) : expand(e));
	el.$$(':scope > li').forEach((li, i) => {
		li.style.display = i === index ? 'list-item' : 'none';
	});
}

export default customSelect;
