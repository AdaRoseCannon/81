/* global ColorThief */
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
export default () => {
	const colorThief = new ColorThief();
	const video = document.createElement('video');
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 64;
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = false;
	canvas.css({
		width: 192,
		height: 192,
		flexShrink: 0
	});
	document.body.appendChild(canvas);

	function takePhoto() {
		context.drawImage(video, 0, 0, 64, 64);
		// get image data from canvas
		// assign it to html image
		// pass it into:
		// console.log(colorThief.getPalette(context, 16));
		// apply palette back in canvas
		// render it back out.
	}

	navigator.getUserMedia({ 'video': true }, function (stream) {
		video.src = window.URL.createObjectURL(stream);
		video.play();
		setTimeout(function () {
			takePhoto();
			video.pause();
			video.src = '';
			stream.getTracks()[0].stop();
		}, 500);
	}, e => {
		console.error(e);
	});
};
