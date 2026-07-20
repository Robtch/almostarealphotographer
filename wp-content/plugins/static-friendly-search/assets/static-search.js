/**
 * Static-friendly instant search.
 *
 * Fetches the JSON index (built server-side, but it's just a static
 * file — no live query needed to read it) once, then filters it
 * entirely client-side on every keystroke. Works identically on the
 * live WordPress site and a fully static export, since nothing here
 * depends on PHP running at query time.
 */
(function () {
	'use strict';

	var indexData = null;
	var indexPromise = null;

	function loadIndex() {
		if (indexPromise) return indexPromise;
		indexPromise = fetch(sfsSearchData.indexUrl)
			.then(function (res) {
				return res.json();
			})
			.then(function (data) {
				indexData = data;
				return data;
			})
			.catch(function (err) {
				console.error('Static-Friendly Search: could not load search index.', err);
				return [];
			});
		return indexPromise;
	}

	function matches(entry, query) {
		var haystack = (entry.title + ' ' + entry.excerpt + ' ' + entry.terms).toLowerCase();
		return haystack.indexOf(query) !== -1;
	}

	function renderResults(container, results) {
		container.innerHTML = '';
		if (!results.length) {
			container.style.display = 'none';
			return;
		}
		var list = document.createElement('ul');
		list.className = 'sfs-results-list';
		results.slice(0, 8).forEach(function (entry) {
			var li = document.createElement('li');
			var a = document.createElement('a');
			a.href = entry.url;
			a.className = 'sfs-result-title';
			a.textContent = entry.title;
			li.appendChild(a);
			if (entry.excerpt) {
				var p = document.createElement('p');
				p.className = 'sfs-result-excerpt';
				p.textContent = entry.excerpt;
				li.appendChild(p);
			}
			list.appendChild(li);
		});
		container.appendChild(list);
		container.style.display = 'block';
	}

	function attachToInput(input) {
		if (input.dataset.sfsAttached) return;
		input.dataset.sfsAttached = 'true';

		var resultsContainer = document.createElement('div');
		resultsContainer.className = 'sfs-results';
		resultsContainer.style.display = 'none';

		// Place the results dropdown right after the input's form (or
		// the input itself if it's not in a form), so it's positioned
		// sensibly regardless of the theme's exact markup.
		var anchor = input.closest('form') || input;
		anchor.parentNode.insertBefore(resultsContainer, anchor.nextSibling);

		input.addEventListener('input', function () {
			var query = input.value.trim().toLowerCase();
			if (!query) {
				resultsContainer.style.display = 'none';
				return;
			}
			loadIndex().then(function (data) {
				var results = data.filter(function (entry) {
					return matches(entry, query);
				});
				renderResults(resultsContainer, results);
			});
		});

		// Prevent the form from actually submitting to a live PHP
		// search page — on a static export that page either doesn't
		// exist or won't reflect an arbitrary typed query.
		var form = input.closest('form');
		if (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var firstResult = resultsContainer.querySelector('.sfs-result-title');
				if (firstResult) {
					window.location.href = firstResult.href;
				}
			});
		}

		document.addEventListener('click', function (e) {
			if (!anchor.contains(e.target)) {
				resultsContainer.style.display = 'none';
			}
		});
	}

	function init() {
		var inputs = document.querySelectorAll(
			'form[role="search"] input[type="search"], .search-form input[type="search"], input[type="search"]'
		);
		inputs.forEach(attachToInput);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
