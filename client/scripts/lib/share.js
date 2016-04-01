/* global $, $$*/

import Clipboard from 'clipboard';

const sharecode = (url, user, text) => `
	<a href="https://twitter.com/share" class="twitter-share-button" data-url="${url}" data-text="${text}" data-via="Lady_Ada_King" data-size="large" data-related="${user}" data-hashtags="81Emoji" data-dnt="true">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>`;

function init() {
	const wrapper = $('#emoji__share-wrapper');
	const user = document.body.dataset.username || '@AnonymousUser';
	const quoteUrl = 'https://81.ada.is/quote?postids=';

	if (wrapper) {
		wrapper.style.display = '';

		new Clipboard('#emoji__share-clipboard');
		const link = $('#emoji__share-link');

		$('#emoji__share-cancel').on('click', function () {
			document.body.classList.remove('post-select');
			$$('.selected').forEach(el => el.classList.remove('selected'));
		});

		const sharecodePlacement = document.createElement('span');
		$('#emoji__share-buttons').prependChild(sharecodePlacement);

		wrapper.on('update', function (e) {
			const url = quoteUrl + e.detail.postids.join(',') + '&by=' + user;
			link.value = quoteUrl + e.detail.postids.join(',');
			sharecodePlacement.innerHTML = sharecode(quoteUrl + e.detail.postids.join(','), user, e.detail.text);
		});
	}
}

export {init};
