/* global $, $$, TweenLite, Back, Draggable */

let draggableGrid;
let draggableOptions;

const showGrid = d => {
	if (!draggableGrid) return;
	if (d === undefined) d = draggableGrid.update().y < 100;
	TweenLite.to(draggableGrid.target, 0.45, {ease: Back.easeOut, y: d ? 0 : document.body.clientHeight});
	draggableGrid.update();
	draggableGrid.applyBounds();
};

const showOptions = d => {
	if (!draggableOptions) return;
	if (d === undefined) d = draggableOptions.update().x < 100;
	TweenLite.to(draggableOptions.target, 0.45, {ease: Back.easeOut, x: d ? 0 : document.body.clientWidth});
	draggableOptions.update();
	draggableOptions.applyBounds();
};

function init() {

	window.on('resize', () => {
		showGrid();
		showOptions();
		draggableOptions.update();
		draggableGrid.update();
	});

	$('#emoji__options-button').on('click', e => {
		e.stopPropagation();
		showOptions(true);
	});
	document.body.on('click', () => {
		showGrid(false);
		showOptions(false);
		$('#skin-tone-selector').fire('close');
	});
	$('#emoji__options').on('click', e => {
		e.stopPropagation();
		$$('.custom-ul-select').forEach(el => el.fire('close'));
	});
	$('#emoji__grid').on('click', e => e.stopPropagation());

	function addExitXtoHandle(el, fn) {
		const x = el.$('.handle').$('<span class="handle_exit-x">×</span>');
		x.on('click', fn);
	}

	addExitXtoHandle($('#emoji__grid'), () => showGrid(false));
	addExitXtoHandle($('#emoji__options'), () => showOptions(false));

	draggableGrid = Draggable.create('#emoji__grid', {
		type:'y',
		trigger:'#emoji__grid-handle',
		onDragEnd: function () { showGrid(this.y < 100) }
	})[0];

	draggableOptions = Draggable.create('#emoji__options', {
		type:'x',
		trigger:'#emoji__options .heading, #emoji__options .handle',
		onDragEnd: function () { showOptions(this.x < 100) }
	})[0];
}

export {
	init,
	showGrid,
	showOptions
}
