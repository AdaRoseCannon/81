/* global $, $$, TweenLite, Back, Draggable */

export default function touchInit() {
	'use strict';

	const grid = d => {
		if (d === undefined) d = draggableGrid.update().y < 100;
		TweenLite.to($('#emoji__grid'), 0.45, {ease: Back.easeOut, y: d ? 0 : document.body.clientHeight});
	};
	const options = d => {
		if (d === undefined) d = draggableOptions.update().x < 100;
		TweenLite.to($('#emoji__options'), 0.45, {ease: Back.easeOut, x: d ? 0 : document.body.clientWidth});
	};

	window.on('resize', () => {
		grid();
		options();
	});

	$('#emoji__options-button').on('click', e => {
		e.stopPropagation();
		options(true);
	});
	$('#emoji__text-input').on('click', e => {
		e.stopPropagation();
		$('#emoji__text-input-focsable').focus();
		grid(true);
	});
	$('#emoji__text-input-focsable').on('keydown', e => {
		const key = e.keyCode || e.charCode;
		let preventDefault = false;
		if ( key === 8 || key === 46 ){
			preventDefault = true;
			$('#emoji__text-input').fire('backspace');
		}
		if (key === 37) {
			preventDefault = true;
			$('#emoji__text-input').fire('back-cursor');
		}
		if (key === 39) {
			preventDefault = true;
			$('#emoji__text-input').fire('forward-cursor');
		}
		if (preventDefault) {
			e.preventDefault();
			return false;
		}
	})
	$('#emoji__text-input-backspace').on('click', e => {
		$('#emoji__text-input').fire('backspace');
		e.preventDefault();
		e.stopPropagation();
		$('#emoji__text-input-focsable').focus();
	});
	document.body.on('click', () => {
		grid(false);
		options(false);
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

	addExitXtoHandle($('#emoji__grid'), () => grid(false));
	addExitXtoHandle($('#emoji__options'), () => options(false));

	const draggableGrid = Draggable.create('#emoji__grid', {
		type:'y',
		trigger:'#emoji__grid-handle',
		onDragEnd: function () { grid(this.y < 100) }
	})[0];

	const draggableOptions = Draggable.create('#emoji__options', {
		type:'x',
		trigger:'#emoji__options .heading, #emoji__options .handle',
		onDragEnd: function () { options(this.x < 100) }
	})[0];

	const messagesEl = $('#emoji__messages');
	const messageDraggable = Draggable.create(messagesEl, {
		type:'y',
		bounds: messagesEl.parentNode,
		edgeResistance:0.65,
		onDragStart: function () {
			this.target.style.transition = 'initial';
		},
		onDragEnd: function () {
			this.target.style.transition = '';
		}
	})[0];
	window.messageDraggable = messageDraggable;

	let messageDraggableTimeout;
	messagesEl.on('mousewheel', function (e) {
		TweenLite.to(messageDraggable.target, 0.45, {ease: Back.easeOut, y: messageDraggable.y + e.wheelDelta});
		clearTimeout(messageDraggableTimeout);
		messageDraggableTimeout = setTimeout(() => messageDraggable.applyBounds(), 300);
	});
}
