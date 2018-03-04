

function convertToCSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';
	str += 'Categories, , Tags,' + '\r\n';
	str += 'Name, Count, Name, Count' + '\r\n';
	for (var i = 0; i < array.length; i++) {
		var line = '';
		if ('|' !== array[i]) {
			for (var index in array[i]) {
				line += array[i][index];
				line += ',';
			}
			str += line;
		} else {
			str += '\r\n';
		}
	}
	return str;
}

function exportCSVFile(items, fileTitle) {
	// Convert Object to JSON
	var jsonObject = JSON.stringify(items);

	var csv = this.convertToCSV(jsonObject);

	var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

	var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, exportedFilenmae);
	} else {
		var link = document.createElement("a");
		if (link.download !== undefined) { // feature detection
			// Browsers that support HTML5 download attribute
			var url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", exportedFilenmae);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
}
var fileTitle = 'rare';
// Init data
fetchTax('rare.us');

$("#siteSelect").change(function() {
	clearIt();
	var val = $( this ).val();
	fetchTax(val);
});
$("#go").click(function(e) {
	e.preventDefault();
	clearIt();
	var $siteName = $('#siteTitle');
	var val = $( "#siteInput" ).val();
	var prettyVal = val.substring(0, val.indexOf('.'));
	$siteName.text(prettyVal);
	fetchTax(val);
});
$("#download").click(function(e) {
	e.preventDefault();
	prepDownload();
});

function clearIt(selector) {
	selector = typeof selector !== 'undefined' ? selector : 'table';
	$(selector + " > tbody tr").remove();
}
function fetchTax(site) {
	var $siteName = $('#siteTitle');
	var $siteDesc = $('#siteDesc');
	// Start fresh
	$siteName.text('');
	$siteDesc.text('');
	var desc = 'No description provided';
	// First figure out if VIP or non VIP
	$.ajax({
		type: 'GET',
		url: 'https://public-api.wordpress.com/rest/v1.1/sites/' + site,
		success: function(data) {
			if (data.URL.length > 0) {
				$siteName.html('<a target="_blank" href="' + data.URL + '">' + data.name + '</a>');
			} else {
				$siteName.text(data.name);
			}
			if(data.description.length > 0) {
				desc = data.description;
			}
			$siteDesc.text(desc);
			// VIP
			fetchCategories(site);
			fetchTags(site);
		},
		error: function(data) {
			$.ajax({
				type: 'GET',
				url: 'https://www.' + site + '/wp-json/',
				success: function(data) {
					if (data.url.length > 0) {
						$siteName.html('<a target="_blank" href="' + data.url + '">' + data.name + '</a>');
					} else {
						$siteName.text(data.name);
					}
					if(data.description.length > 0) {
						desc = data.description;
					}
					$siteDesc.text(desc);
				}
			});
			var catUrl = 'https://www.' + site + '/wp-json/wp/v2/categories/';
			var tagUrl = 'https://www.' + site + '/wp-json/wp/v2/tags/';
			// Non VIP
			fetchCategories(site, catUrl);
			fetchTags(site, tagUrl);
		}
	});
}
function fetchCategories(site, url) {
	var allCats = [];
	url = typeof url !== 'undefined' ? url : 'https://public-api.wordpress.com/rest/v1.1/sites/' + site + '/categories/?number=1000';
	///wp-json/wp/v2/tags/
	// First figure out if VIP or non VIP
	$.ajax({
		type: 'GET',
		url: url,
		success: function(data) {
			buildCats(allCats, data);
		}
	});
}
function fetchTags(site, url) {
	var allTags = [];
	url = typeof url !== 'undefined' ? url : 'https://public-api.wordpress.com/rest/v1.1/sites/' + site + '/tags/?number=300&order=DESC&order_by=count';
	$.ajax({
		type: 'GET',
		url: url,
		success: function(data) {
			buildTags(allTags, data);
		}
	});
}
function buildCats(allCats,data) {
	var name;
	if (typeof data.categories !== 'undefined') {
		data = data.categories;
	}
	for (var i = 0; i < data.length; i++) {
		if (data[i].parent) {
			// Find if current parent has parent
			var currentParent = data[i].parent;
			var parentParent = 0;
			var currentParentName = '';
			for (var a = 0; a < data.length; a++) {
				if (currentParent === data[a].ID) {
					// get parent of parent
					parentParent = data[a].parent;
					currentParentName = data[a].name;
				}
			}
			if (parentParent) {
				// Get parentParent name
				for (var b = 0; b < data.length; b++) {
					if (parentParent === data[b].ID) {
						// get parent of parent
						parentParent = data[b].name;
					}
				}
				name = parentParent + '/' + currentParentName + '/' + data[i].name;
			} else {
				name = currentParentName + '/' + data[i].name;
			}
		} else {
			name = data[i].name;
		}
		// either count or post_count
		var count = data[i].count
		if (typeof data[i].post_count !== 'undefined') {
			count = data[i].post_count;
		}
		allCats.push({
			name: name,
			count: count
		});
		sortCount(allCats);
	}
	for (var c = 0; c < allCats.length; c++) {
		$('#data > tbody:last-child').append('<tr><td>' + allCats[c].name + '</td><td>' + allCats[c].count + '</td></tr>');
	}
	var asc = true;
	$('#data thead tr th').click(function() {
		clearIt('#data');
		if(asc) {
			asc = false;
		} else {
			asc = true;
		}
		var label = $( this ).data('label');
		if (label === 'name') {
			sortName(allCats, asc);
		} else {
			sortCount(allCats, asc);
		}
		storeIt('cat', allCats);
		for (var c = 0; c < allCats.length; c++) {
			$('#data > tbody:last-child').append('<tr><td>' + allCats[c].name + '</td><td>' + allCats[c].count + '</td></tr>');
		}
	});
	storeIt('cat', allCats);
}
function buildTags(allTags, data) {
	var name;
	if (typeof data.tags !== 'undefined') {
		data = data.tags;
	}
	for (var i = 0; i < data.length; i++) {
		var count = data[i].count
		if (typeof data[i].post_count !== 'undefined') {
			count = data[i].post_count;
		}
		allTags.push({
			name: data[i].name,
			count: count
		});
		sortCount(allTags);
	}
	for (var c = 0; c < allTags.length; c++) {
		$('#dataTags > tbody:last-child').append('<tr><td>' + allTags[c].name + '</td><td>' + allTags[c].count + '</td></tr>');
	}
	var asc = true;
	$('#dataTags thead tr th').click(function() {
		clearIt('#dataTags');
		if(asc) {
			asc = false;
		} else {
			asc = true;
		}
		var label = $( this ).data('label');
		if (label === 'name') {
			sortName(allTags, asc);
		} else {
			sortCount(allTags, asc);
		}
		storeIt('tag', allTags);
		for (var c = 0; c < allTags.length; c++) {
			$('#dataTags > tbody:last-child').append('<tr><td>' + allTags[c].name + '</td><td>' + allTags[c].count + '</td></tr>');
		}
	});
	storeIt('tag', allTags);
	// exportCSVFile(allCats, fileTitle);
}
function storeIt(label, arr) {
	sessionStorage.setItem('f1m-tax-' + label, JSON.stringify(arr));
}
function prepDownload() {
	// Parse page
	var data1 = sessionStorage.getItem('f1m-tax-cat');
	var data2 = sessionStorage.getItem('f1m-tax-tag');
	data1 = JSON.parse(data1);
	data2 = JSON.parse(data2);
	var newData = [];
	var count = 0;
	var dataset1 = data1;
	var dataset2 = data2;
	if (data2.length < data1.length) {
		dataset1 = data2;
		dataset2 = data1;
	}
	for (var i = 0; i < dataset1.length; i++) {
		if(dataset2[i]) {
			newData.push(data1[i]);
			newData.push(data2[i]);
			newData.push('|');
			count++;
		}
	}
	// pickup where data1 left off
	for (var i = count; i < dataset2.length; i++) {
		if(data2.length < data1.length) {
			newData.push(data1[i]);
			newData.push({name:'', count:''});
		} else {
			newData.push({name:'', count:''});
			newData.push(data2[i]);
		}
		newData.push('|');
	}

	// console.log(newData);
	exportCSVFile(newData, fileTitle);
}
function sortCount(items, asc) {
	asc = typeof asc !== 'undefined' ? asc : true;
	// sort by value
	items.sort(function (a, b) {
		if (asc) {
			return b.count - a.count;
		} else {
			return a.count - b.count;
		}
	});
}
function sortName(items, asc) {
	asc = typeof asc !== 'undefined' ? asc : true;
	items.sort(function(a, b) {
		var nameA = a.name.toUpperCase(); // ignore upper and lowercase
		var nameB = b.name.toUpperCase(); // ignore upper and lowercase
		if (nameA < nameB) {
			if(asc) {
				return -1;
			} else {
				return 1;
			}
		}
		if (nameA > nameB) {
			if(asc) {
				return 1;
			} else {
				return -1;
			}
		}
		// names must be equal
		return 0;
	});
}

