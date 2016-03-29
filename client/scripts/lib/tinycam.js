/* global ColorThief, Draggable, $, twemoji */
import color from 'tinycolor2';
import {compress} from 'ftdatasquasher';
import {sendPhoto} from './api';
import {warn} from './notify';

function vectorToColor([r,g,b]) {
	const col = color({r,g,b});
	col.vector = [r,g,b];
	return col;
}

function colorToVector(color) {
	const o = color.toRgb();
	return [o.r, o.g, o.b];
}

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
export default () => {

	let palette = false;
	let prePalette = false;
	let postPalette = false;
	let toggleFunc = start;
	let stopFunc;
	let currentFilter = 0;
	const filters = [
		{
			name: '#noFilter'
		},
		{
			name: 'Spin',
			postsort: color => color.saturate(20).spin(180)
		},
		{
			name: 'Brighten',
			postsort: color => color.brighten(20)
		},
		{
			name: 'Pop',
			postsort: color => color.saturate(20).brighten(20)
		},
		{
			name: 'Power Pink',
			postsort: colorIn => {
				const col2 = colorIn.toHsv();
				col2.h = 310;
				col2.s = 0.2 + col2.s*0.8;
				col2.v = 0.2 + col2.v*0.8;
				return color(col2);
			}
		}
	];

	const photoModal = $('<div class="modal tinycam"><div class="handle"><span class="handle_icon">📷</span><span class="handle_exit-x">×</span></div></div>');
	document.body.prependChild(photoModal);
	const colorThief = new ColorThief();
	const video = document.createElement('video');
	const canvas = document.createElement('canvas');
	const buffer = document.createElement('img');
	const filterTitle = document.createElement('span');
	filterTitle.classList.add('filter-label');

	buffer.onload = function () {
		const paletteArr = colorThief.getPalette(buffer, 16);
		if (paletteArr) {
			palette = processPalette(paletteArr);

			const filter = filters[currentFilter];
			filterTitle.innerHTML = filter.name;
			if (!filter.presort) filter.presort = i => i;
			if (!filter.postsort) filter.postsort = i => i;

			prePalette = palette.map(a => colorToVector(filter.presort(vectorToColor(a.vector))));
			postPalette = prePalette.map(a => colorToVector(filter.postsort(vectorToColor(a))));
		}
	}
	buffer.width = buffer.height = canvas.width = canvas.height = 64;
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = false;
	photoModal.appendChild(canvas);
	photoModal.appendChild(filterTitle);

	const buttonArea = document.createElement('div');
	photoModal.appendChild(buttonArea);
	buttonArea.classList.add('button-area');
	buttonArea.classList.add('take-photo');
	const buttonPhoto = buttonArea.$('<button>📷</button>');
	buttonPhoto.on('click', function () {
		stopFunc();
		photoModal.classList.add('confirm');
	});
	const buttonFilter = buttonArea.$('<button class="small">🖼</button>');
	buttonFilter.on('click', function () {

		// toggle filters
		currentFilter = (currentFilter + 1) % filters.length;
		render(true);
	});

	const buttonArea2 = document.createElement('div');
	photoModal.appendChild(buttonArea2);
	buttonArea2.classList.add('button-area');
	buttonArea2.classList.add('approval');
	const buttonApprove = buttonArea2.$('<button>✔️</button>');
	buttonApprove.on('click', function () {
		if (stopFunc) stopFunc();

		const username = $('#emoji__recipient').value;
		if (username === '') {
			return warn('No User');
		}

		render();

		sendPhoto(username, compress(canvas.toDataURL()))
		.then(function () {
			photoModal.classList.add('collapsed');
			photoModal.classList.remove('confirm');
		})
		.catch(e => warn(e.message));

	});
	const buttonCancel = buttonArea2.$('<button class="small">❌</button>');
	buttonCancel.on('click', function () {

		photoModal.classList.remove('confirm');

		// already running
		if (stopFunc) return;
		start();
	});


	twemoji.parse(photoModal);

	const draggable = Draggable.create(photoModal, {
		trigger: photoModal.$('.handle'),
		type:'xy',
		bounds: document.body,
		edgeResistance:0.65,
		onDragStart: function () {
			this.target.style.transition = 'initial';
		},
		onDragEnd: function () {
			this.target.style.transition = '';
		},
		onClick: toggle,
		minimumMovement: 3 * (window.devicePixelRatio || 1)
	})[0];

	photoModal.style.height = photoModal.clientHeight + 'px';
	photoModal.classList.add('collapsed');

	// sort the array into rgb objects
	function processPalette(p) {
		return p.map(vectorToColor)
		.sort((a,b) => a.toHsv().v - b.toHsv().v);
	}

	function distance(threeVA, threeVB) {
		const dx = threeVA[0] - threeVB[0];
		const dy = threeVA[1] - threeVB[1];
		const dz = threeVA[2] - threeVB[2];
		return dx*dx + dy*dy + dz*dz;
	}

	function render(updatePalette) {
		const h = video.videoHeight;
		const w = video.videoWidth;
		const smallestSide = Math.min(h, w);
		const width = 64 * w/smallestSide;
		const height = 64 * h/smallestSide;
		if (isNaN(width) || isNaN(height)) return;
		context.drawImage(video, (64 - width)/2, (64 - height)/2, width, height);
		if (!palette || updatePalette) {
			buffer.src = canvas.toDataURL();
		}
		if (palette) {
			const data = context.getImageData(0,0,64,64);
    		for (let i = 0, l = data.data.length; i < l; i += 4) {
				const r = data.data[i];
				const g = data.data[i+1];
				const b = data.data[i+2];
				const arr = [r,g,b];

				const closestColor = prePalette.concat().sort((a,b) => distance(a,arr) - distance(b,arr))[0];
				const index = prePalette.indexOf(closestColor);

				data.data[i] = postPalette[index][0];
				data.data[i+1] = postPalette[index][1];
				data.data[i+2] = postPalette[index][2];
			}
			context.putImageData(data, 0, 0);
		}
	}

	function start() {

		navigator.getUserMedia({ 'video': true }, function (stream) {

			// 6 fps camera
			const interval1 = setInterval(render, 60/6);

			// update palette every 2 seconds
			const interval2 = setInterval(() => render(true), 2000);
			photoModal.classList.remove('collapsed');
			setTimeout(() => {
				draggable.applyBounds();
			}, 600);

			function stop() {

				video.pause();
				video.src = '';
				stream.getTracks()[0].stop();
				toggleFunc = start
				stopFunc = undefined;

				clearInterval(interval1);
				clearInterval(interval2);
			}

			video.src = window.URL.createObjectURL(stream);
			video.play();

			toggleFunc = function () {
				photoModal.classList.add('collapsed');
				stop();
			};
			stopFunc = stop;

		}, e => {
			console.error(e);
		});
	}
	function toggle() {
		toggleFunc();
	}

	return {
		toggle,
		photoModal
	}
};
