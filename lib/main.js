'use strict';

function addScript (url) {
	const p = new Promise(function (resolve, reject) {
		const script = document.createElement('script');
		script.setAttribute('src', url);
		document.head.appendChild(script);
		script.onload = resolve;
		script.onerror = reject;
	});
	function promiseScript () {
		return p;
	};
	promiseScript.promise = p;
	return promiseScript;
}


addScript('https://cdn.rawgit.com/AdaRoseEdwards/dirty-dom/v1.1.1/build/dirty-dom-lib.min.js').promise.then(() => {

	let cursorPos = 0;
	const textInput = $('#emoji__text-input');
	function setChar(str) {
		if (!str) return;
		if (cursorPos === 0) {
			textInput.dataset.prepend = str;
		}
		if (cursorPos === 1) {
			textInput.textContent = str;
		}
		if (cursorPos === 2) {
			textInput.dataset.append = str;
		}
		cursorPos = (cursorPos + 1) % 3;
	}

	const skinTone = ["🏼", "🏿", "🏽", "🏾", "🏻"];

	const subEmojis = [
		["😋", "😎", "😍", "😘", "😗", "😙", "😚", "☺", "😇"],
		["✍", "✋", "✌️", "👐", "👌", "👊", "👏", "👋", "🙋"],
		["👩", "👢", "👵", "👚", "👒", "👡", "👯", "🚺", "👭"],
		["👜", "🚹", "👘", "👖", "👞", "👠", "👢", "👕", "👚", "👒"],
		["😀", "😁", "😂", "😃", "😄", "😅", "😆", "😉", "😊", "😓", "😔", "😕", "😖", "🙃", "😷", "🤒", "🤕", "🤑", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "😬", "😰", "😱", "😳", "😵", "😡", "😠", "👿", "😈", "👦", "👧", "👨", "👩", "👴", "👵", "👶", "👱", "👮", "👲", "👳", "👷", "⛑", "👸", "💂", "🎅", "👼", "🕵", "👯", "💆", "💇", "👰", "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🙇", "🙌"],
		["😐", "😑", "😶", "😣", "😥", "😮", "😪", "😫", "😴"],
		["😌", "🤓", "😛", "😜", "😝", "☹", "🙁", "😒", "😲"],
		['🖖', '😂', '💩', '😘', '🖕', '🤘', '👊', '🍖', '✌'],
		['👅', '🍑', '💋', '🏩', '💩', '👉', '👌', '🍆', '💦']
	];

	// main emojis is made out of middle emoji
	const mainEmojis = subEmojis.map(e => e[4]);

	const makeGrid = (emojis) => MAKE.html(`<div class="emoji__grid-wrapper">
		<span class="emoji__grid-item top left" data-emoji="${emojis[0]}"></span>
		<span class="emoji__grid-item top centre" data-emoji="${emojis[1]}"></span>
		<span class="emoji__grid-item top right" data-emoji="${emojis[2]}"></span>
		<span class="emoji__grid-item middle left" data-emoji="${emojis[3]}"></span>
		<span class="emoji__grid-item middle centre" data-emoji="${emojis[4]}"></span>
		<span class="emoji__grid-item middle right" data-emoji="${emojis[5]}"></span>
		<span class="emoji__grid-item bottom left" data-emoji="${emojis[6]}"></span>
		<span class="emoji__grid-item bottom centre" data-emoji="${emojis[7]}"></span>
		<span class="emoji__grid-item bottom right" data-emoji="${emojis[8]}"></span>
	</div>`);

	const mainGrid = makeGrid(mainEmojis).firstChild;
	mainGrid.$$('.emoji__grid-item').forEach((item, i) => {

		const subGrid = makeGrid(subEmojis[i]).firstChild;
		const value = subEmojis[i][4];

		function triggerBox (e) {
			e.preventDefault();
			e.stopPropagation();

			const startTime = Date.now();
			subGrid.classList.add('expand');
			function handleProxy(e) {
				handleClick(e, startTime, handleProxy, subGrid);
			}
			document.on('mouseup', handleProxy);
			document.on('touchend', handleProxy);
		}

		item.on('mousedown', triggerBox, true);
		item.on('touchdstart', triggerBox, true);

		subGrid.classList.add('emoji__sub-grid');
		item.appendChild(subGrid);
	});

	$('#emoji__grid').appendChild(mainGrid);

	function handleClick (e, startTime, fn, subGrid) {

		if (Date.now() - startTime < 200) {
			setChar(subGrid.parentNode.dataset.emoji);
		} else {
			if (event.changedTouches) {
				const changedTouch = event.changedTouches[0];
				const elem = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
				setChar(elem.dataset.emoji);
			} else {
				setChar(e.target.dataset.emoji);
			}
		};

		e.currentTarget.off('mouseup', fn);
		e.currentTarget.off('touchend', fn);
		clickUp();
	}

	function clickUp (e) {
		$$('.expand').forEach(el => {
			el.classList.remove('expand');
			el.off('mouseup', handleClick);
			el.off('touchend', handleClick);
		});
	}

	document.body.on('touchmove', e => {
		e.preventDefault();
		return false;
	});


	document.body.on('touchcancel', () => {
		clickUp();
	});
});
