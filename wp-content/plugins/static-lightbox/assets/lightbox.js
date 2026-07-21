/**
 * Minimal lightbox. No dependencies, no backend calls.
 * Automatically bound to any ".lightbox-item" link by the
 * Static Lightbox Gallery plugin's render_block filter.
 */
(function () {
	'use strict';

	var overlay, imgEl, captionEl, counterEl, currentGroup, currentIndex;

	function buildOverlay() {
		overlay = document.createElement('div');
		overlay.className = 'lightbox-overlay';
		overlay.setAttribute('aria-hidden', 'true');
		overlay.innerHTML =
			'<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
			'<button type="button" class="lightbox-prev" aria-label="Previous">&#8249;</button>' +
			'<button type="button" class="lightbox-next" aria-label="Next">&#8250;</button>' +
			'<figure class="lightbox-figure">' +
			'<img class="lightbox-image" alt="">' +
			'<figcaption class="lightbox-caption"></figcaption>' +
			'</figure>' +
			'<div class="lightbox-counter"></div>';
		document.body.appendChild(overlay);

		imgEl = overlay.querySelector('.lightbox-image');
		captionEl = overlay.querySelector('.lightbox-caption');
		counterEl = overlay.querySelector('.lightbox-counter');

		overlay.querySelector('.lightbox-close').addEventListener('click', close);
		overlay.querySelector('.lightbox-prev').addEventListener('click', function () {
			show(currentIndex - 1);
		});
		overlay.querySelector('.lightbox-next').addEventListener('click', function () {
			show(currentIndex + 1);
		});

		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) close();
		});

		document.addEventListener('keydown', function (e) {
			if (!overlay.classList.contains('is-open')) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') show(currentIndex - 1);
			if (e.key === 'ArrowRight') show(currentIndex + 1);
		});
	}

	function collectGroup(triggerEl) {
		var groupKey = triggerEl.getAttribute('data-gallery');
		var selector = groupKey
			? '.lightbox-item[data-gallery="' + groupKey + '"]'
			: '.lightbox-item:not([data-gallery])';
		return Array.prototype.slice.call(document.querySelectorAll(selector));
	}

	function show(index) {
		var len = currentGroup.length;
		currentIndex = (index + len) % len;
		var el = currentGroup[currentIndex];
		var fullSrc = el.getAttribute('href');
		var caption = el.getAttribute('data-caption') || el.querySelector('img').getAttribute('alt') || '';

		imgEl.src = fullSrc;
		imgEl.alt = caption;
		captionEl.textContent = caption;
		counterEl.textContent = len > 1 ? currentIndex + 1 + ' / ' + len : '';

		var multiple = len > 1;
		overlay.querySelector('.lightbox-prev').style.display = multiple ? '' : 'none';
		overlay.querySelector('.lightbox-next').style.display = multiple ? '' : 'none';
	}

	function open(triggerEl) {
		currentGroup = collectGroup(triggerEl);
		var index = currentGroup.indexOf(triggerEl);
		show(index);
		overlay.classList.add('is-open');
		overlay.setAttribute('aria-hidden', 'false');
		document.body.classList.add('lightbox-lock-scroll');
	}

	function close() {
		overlay.classList.remove('is-open');
		overlay.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('lightbox-lock-scroll');
		imgEl.src = '';
	}

	function init() {
		if (!overlay) buildOverlay();
		document.addEventListener('click', function (e) {
			var trigger = e.target.closest('.lightbox-item');
			if (!trigger) return;
			e.preventDefault();
			open(trigger);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
