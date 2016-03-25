/* global ColorThief, $ */
import color from 'tinycolor2';

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
export default () => {
	const photoModal = $('<div class="modal"></div>');
	document.body.prependChild(photoModal);
	const colorThief = new ColorThief();
	const video = document.createElement('video');
	const canvas = document.createElement('canvas');
	const buffer = document.createElement('img');
	buffer.width = buffer.height = canvas.width = canvas.height = 64;
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = false;
	photoModal.appendChild(canvas);

	let palette = false;

	// sort the array into rgb objects
	function processPalette(p) {
		return p.map(function ([r,g,b]) {
			return color({r,g,b});
		})
		.sort((a,b) => a.toHsv().v - b.toHsv().v);
	}

	function render() {
		const h = video.videoHeight;
		const w = video.videoWidth;
		const smallestSide = Math.min(h, w);
		const width = 64 * w/smallestSide;
		const height = 64 * h/smallestSide;
		if (isNaN(width) || isNaN(height)) return;
		context.drawImage(video, (64 - width)/2, (64 - height)/2, width, height);
	}

	function takePhoto() {
		buffer.src = canvas.toDataURL();
		palette = processPalette(colorThief.getPalette(buffer, 16));
		palette.forEach(c => {
			console.log('%c' + c.toHex(), 'background: #' + c.toHex() + ';' );
		});
		render();
	}

	navigator.getUserMedia({ 'video': true }, function (stream) {

		function stop() {
			video.pause();
			video.src = '';
			stream.getTracks()[0].stop();
		}

		video.src = window.URL.createObjectURL(stream);
		video.play();

		setInterval(render, 60/24);

		setTimeout(function () {
			takePhoto();
		}, 4000);
	}, e => {
		console.error(e);
	});
};
