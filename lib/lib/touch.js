/* global $, $$ */


import Draggable from 'gsap/src/uncompressed/utils/Draggable';
import TweenLite from 'gsap/src/uncompressed/TweenLite';

export default function touchInit() {
	const grid = d => TweenLite.set($('#emoji__grid'), {y: d !== false ? 0 : document.body.clientHeight});

	const options = d => TweenLite.set($('#emoji__options'), {x: d !== false ? 0 : document.body.clientWidth});

	$('#emoji__options-button').on('click', e => {
		e.stopPropagation();
		options(true);
	});
	$('#emoji__options-exit').on('click', () => options(false));
	$('#emoji__text-input').on('click', e => {
		e.stopPropagation();
		grid(true);
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

	Draggable.create('#emoji__grid', {
		type:'y',
		// trigger:'#emoji__grid-handle',
		onDragEnd: function () { grid(this.y < 100) },
		force3D:true
	});

	Draggable.create('#emoji__options', {
		type:'x',
		// trigger:'#emoji__options .heading',
		onDragEnd: function () { options(this.x < 100) },
		force3D:true
	});

	Draggable.create('#skin-tone-selector', {
		type:'y',
		bounds: '#emoji__options',
		edgeResistance:0.65,
		force3D:true
	});
}
