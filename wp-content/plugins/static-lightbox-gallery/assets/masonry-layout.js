/**
 * Deterministic masonry layout.
 *
 * Positions items with plain JS math instead of CSS `column-count`,
 * because native CSS multi-column layout is implemented differently
 * across browsers (WebKit vs Blink), producing inconsistent results.
 * This avoids that entirely by calculating identical positions
 * everywhere.
 *
 * Reads the `width`/`height` HTML attributes WordPress already puts
 * on every image, so layout can be computed immediately without
 * waiting for images to finish loading.
 */
(function () {
	'use strict';

	function getColumnCount(containerWidth) {
		if (containerWidth <= 900) return 2;
		return 3;
	}

	function getGap(containerWidth) {
		return containerWidth <= 520 ? 8 : 12;
	}

	function layout(container) {
		var items = Array.prototype.slice.call(
			container.querySelectorAll('.wp-block-image, .blocks-gallery-item')
		);
		if (!items.length) return;

		var containerWidth = container.clientWidth;
		var columnCount = getColumnCount(containerWidth);
		var gap = getGap(containerWidth);
		var colWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
		var colHeights = new Array(columnCount).fill(0);

		items.forEach(function (item) {
			var img = item.querySelector('img');
			if (!img) return;

			var w = parseFloat(img.getAttribute('width'));
			var h = parseFloat(img.getAttribute('height'));
			var ratio = w && h ? h / w : (img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.75);
			var itemHeight = colWidth * ratio;

			var minCol = 0;
			for (var i = 1; i < columnCount; i++) {
				if (colHeights[i] < colHeights[minCol]) minCol = i;
			}

			item.style.width = colWidth + 'px';
			item.style.left = minCol * (colWidth + gap) + 'px';
			item.style.top = colHeights[minCol] + 'px';

			colHeights[minCol] += itemHeight + gap;
		});

		container.style.height = Math.max.apply(null, colHeights) - gap + 'px';
		container.classList.add('masonry-ready');
	}

	function layoutAll() {
		var containers = document.querySelectorAll('.wp-block-gallery.masonry-gallery');
		containers.forEach ? containers.forEach(layout) : Array.prototype.forEach.call(containers, layout);
	}

	var resizeTimer;
	function onResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(layoutAll, 150);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', layoutAll);
	} else {
		layoutAll();
	}
	window.addEventListener('resize', onResize);

	// Fallback: if any image is missing width/height attributes, its
	// aspect ratio uses a guess above — correct the layout once that
	// image actually loads and we know its real size.
	document.addEventListener(
		'load',
		function (e) {
			if (e.target && e.target.tagName === 'IMG' && e.target.closest('.wp-block-gallery.masonry-gallery')) {
				layoutAll();
			}
		},
		true
	);
})();
