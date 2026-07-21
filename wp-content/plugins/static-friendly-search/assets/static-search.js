/**
 * Static-friendly instant search.
 *
 * Fetches the JSON index once, then filters it entirely client-side
 * on every keystroke — no server needed at query time, so this works
 * identically on the live WordPress site and a fully static export.
 *
 * Site base path is derived at RUNTIME from this very script's own
 * <script src="...">  tag, rather than trusted from anything computed
 * server-side. That's deliberate: WordPress itself doesn't know in
 * advance that it'll later be exported to a GitHub Pages *project*
 * site living in a subfolder (e.g. /almostarealphotographer/) rather
 * than a domain root — so any absolute URL baked in during PHP/export
 * time would be wrong. A <script src> attribute, on the other hand,
 * IS something Simply Static reliably rewrites to the correct final
 * location, so it's the one thing safe to anchor everything else to.
 */
(function () {
	'use strict';

	var INDEX_FILENAME = 'static-search-index.json';

	var indexPromise = null;

	function getSiteBase() {
		var scripts = document.querySelectorAll('script[src*="static-search.js"]');
		if (!scripts.length) return '';
		var src = scripts[scripts.length - 1].src;
		var marker = '/wp-content/';
		var idx = src.indexOf(marker);
		if (idx === -1) return '';
		return src.substring(0, idx);
	}

	var siteBase = getSiteBase();

	function toAbsolute(path) {
		// entry.url from the index is site-root-relative (e.g.
		// "/a-trip-to-the-north/"). Prefix it with whatever base path
		// this deployment actually lives at.
		return siteBase + path;
	}

	function loadIndex() {
		if (indexPromise) return indexPromise;
		var indexUrl = siteBase + '/wp-content/uploads/' + INDEX_FILENAME;
		indexPromise = fetch(indexUrl)
			.then(function (res) {
				return res.json();
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
			a.href = toAbsolute(entry.url);
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
