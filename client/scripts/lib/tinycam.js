/* global ColorThief, Draggable, $, twemoji */
import color from 'tinycolor2';
import {compress} from 'ftdatasquasher';

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
export default () => {

	let palette = false;
	let toggleFunc = start;
	let stopFunc;
	let currentFilter = 0;
	const filters = [
		false
	];

	const photoModal = $('<div class="modal tinycam"><div class="handle"><span class="handle_icon">📷</span><span class="handle_exit-x">×</span></div></div>');
	document.body.prependChild(photoModal);
	const colorThief = new ColorThief();
	const video = document.createElement('video');
	const canvas = document.createElement('canvas');
	const buffer = document.createElement('img');
	buffer.onload = function () {
		const paletteArr = colorThief.getPalette(buffer, 16);
		if (paletteArr) palette = processPalette(paletteArr);
	}
	buffer.width = buffer.height = canvas.width = canvas.height = 64;
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = false;
	photoModal.appendChild(canvas);

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
	});

	const buttonArea2 = document.createElement('div');
	photoModal.appendChild(buttonArea2);
	buttonArea2.classList.add('button-area');
	buttonArea2.classList.add('approval');
	const buttonApprove = buttonArea2.$('<button>✔️</button>');
	buttonApprove.on('click', function () {
		if (stopFunc) stopFunc();
		photoModal.classList.add('collapsed');
		photoModal.classList.remove('confirm');

		render();
		photoModal.fire('photo', compress(canvas.toDataURL()));
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
		onClick: toggle
	})[0];

	photoModal.style.height = photoModal.clientHeight + 'px';
	photoModal.classList.add('collapsed');

	// sort the array into rgb objects
	function processPalette(p) {
		return p.map(function ([r,g,b]) {
			const col = color({r,g,b});
			col.vector = [r,g,b];
			return col;
		})
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
			// const imageIndex = [];
    		for (let i = 0, l = data.data.length; i < l; i += 4) {
				const r = data.data[i];
				const g = data.data[i+1];
				const b = data.data[i+2];
				const arr = [r,g,b];
				const closestColor = palette.sort((a,b) => distance(a.vector,arr) - distance(b.vector,arr))[0];
				const index = palette.indexOf(closestColor).toString(16);
				// imageIndex[i/4] = index;
				const usePalette = currentFilter ? filters[currentFilter] : palette;
				data.data[i] = usePalette[index].vector[0];
				data.data[i+1] = usePalette[index].vector[1];
				data.data[i+2] = usePalette[index].vector[2];
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
