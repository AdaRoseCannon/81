/* global ColorThief, Draggable, $ */
import color from 'tinycolor2';

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
export default () => {
	const photoModal = $('<div class="modal tinycam collapsed"><div class="handle"></div></div>');
	document.body.prependChild(photoModal);
	const colorThief = new ColorThief();
	const video = document.createElement('video');
	const canvas = document.createElement('canvas');
	const buffer = document.createElement('img');
	buffer.width = buffer.height = canvas.width = canvas.height = 64;
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = false;
	photoModal.appendChild(canvas);

	Draggable.create(photoModal, {
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
	});

	let palette = false;

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

	function render() {
		const h = video.videoHeight;
		const w = video.videoWidth;
		const smallestSide = Math.min(h, w);
		const width = 64 * w/smallestSide;
		const height = 64 * h/smallestSide;
		if (isNaN(width) || isNaN(height)) return;
		context.drawImage(video, (64 - width)/2, (64 - height)/2, width, height);
		if (palette) {
			const data = context.getImageData(0,0,64,64);
			const imageIndex = [];
    		for (let i = 0, l = data.data.length; i < l; i += 4) {
				const r = data.data[i];
				const g = data.data[i+1];
				const b = data.data[i+2];
				const arr = [r,g,b];
				const closestColor = palette.sort((a,b) => distance(a.vector,arr) - distance(b.vector,arr))[0];
				imageIndex[i/4] = palette.indexOf(closestColor).toString(16);
				data.data[i] = closestColor.vector[0];
				data.data[i+1] = closestColor.vector[1];
				data.data[i+2] = closestColor.vector[2];
			}
			context.putImageData(data, 0, 0);
		}
	}

	function getPalette() {
		buffer.src = canvas.toDataURL();
		const paletteArr = colorThief.getPalette(buffer, 16);
		if (!paletteArr) return;
		palette = processPalette(paletteArr);
		// palette.forEach(c => {
		// 	console.log('%c' + c.toHex(), 'background: #' + c.toHex() + ';' );
		// });
		render();
	}

	function start() {

		navigator.getUserMedia({ 'video': true }, function (stream) {

			const interval1 = setInterval(render, 60/24);
			const interval2 = setInterval(getPalette, 500);
			photoModal.classList.remove('collapsed');

			function stop() {
				video.pause();
				video.src = '';
				stream.getTracks()[0].stop();
				toggleFunc = start

				photoModal.classList.add('collapsed');

				clearInterval(interval1);
				clearInterval(interval2);
			}

			video.src = window.URL.createObjectURL(stream);
			video.play();

			toggleFunc = stop;

		}, e => {
			console.error(e);
		});
	}

	let toggleFunc = start;
	function toggle() {
		toggleFunc();
	}

	return {
		toggle
	}
};
