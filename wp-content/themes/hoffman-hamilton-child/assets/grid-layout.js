/**
 * Deterministic masonry layout for the Hamilton-style post grid.
 * Same approach as the gallery plugin: plain JS math instead of native
 * CSS `column-count`, since browsers implement that differently.
 */
(function () {
	'use strict';

	function getColumnCount( containerWidth ) {
		if ( containerWidth <= 900 ) return 2;
		return document.body.classList.contains( 'hhc-three-columns' ) ? 3 : 2;
	}

	function getGap( containerWidth ) {
		return containerWidth <= 520 ? 8 : 12;
	}

	function layout( container ) {
		var items = Array.prototype.slice.call( container.querySelectorAll( '.hhc-grid-item' ) );
		if ( ! items.length ) return;

		var containerWidth = container.clientWidth;
		var columnCount = getColumnCount( containerWidth );
		var gap = getGap( containerWidth );
		var colWidth = ( containerWidth - gap * ( columnCount - 1 ) ) / columnCount;
		var colHeights = new Array( columnCount ).fill( 0 );

		items.forEach( function ( item ) {
			var img = item.querySelector( 'img' );
			var ratio = 1; // square fallback for posts with no featured image

			if ( img ) {
				var w = parseFloat( img.getAttribute( 'width' ) );
				var h = parseFloat( img.getAttribute( 'height' ) );
				ratio = w && h ? h / w : ( img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.75 );
			}

			var itemHeight = colWidth * ratio;

			var minCol = 0;
			for ( var i = 1; i < columnCount; i++ ) {
				if ( colHeights[ i ] < colHeights[ minCol ] ) minCol = i;
			}

			item.style.width = colWidth + 'px';
			item.style.left = minCol * ( colWidth + gap ) + 'px';
			item.style.top = colHeights[ minCol ] + 'px';

			colHeights[ minCol ] += itemHeight + gap;
		} );

		container.style.height = Math.max.apply( null, colHeights ) - gap + 'px';
		container.classList.add( 'hhc-grid-ready' );
	}

	function layoutAll() {
		var containers = document.querySelectorAll( '.hhc-grid' );
		Array.prototype.forEach.call( containers, layout );
	}

	var resizeTimer;
	function onResize() {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( layoutAll, 150 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', layoutAll );
	} else {
		layoutAll();
	}
	window.addEventListener( 'resize', onResize );

	// Correct layout once an image without width/height attributes
	// (rare, but possible) finishes loading and we know its real ratio.
	document.addEventListener(
		'load',
		function ( e ) {
			if ( e.target && e.target.tagName === 'IMG' && e.target.closest( '.hhc-grid' ) ) {
				layoutAll();
			}
		},
		true
	);
} )();
