
// set the initial map options and url here
var INITIAL_MAP_SETTINGS = {
	detectRetina: true,
	center_lat: 34.25,
	center_lon: -118.55,
	zoom: 9
}

var INITIAL_VISJSON_URL = $('#layer-selector .active').data('url');

// state variables
var activeVis = null;
var baseQuery = null; // default for layer
var activeQuery = null; // geo selection if any
var activeCityName = null;
var activeCityOutline = null;

function getCityNameFromId(id) {
	for (i=0; i<inventoryText.length; i++) {
		if (parseInt(inventoryText[i][2]) == id)
			return inventoryText[i][1];
	}
	return '';
}

// could collapse this into the subsequent function
function getInventoryById(cartodb_id) {
	for (i=0; i<inventoryText.length; i++) {
		if (parseInt(inventoryText[i][2]) == cartodb_id)
			return inventoryText[i].slice(1,2).concat(inventoryText[i].slice(4));
		}
	return [];
}

function getInventoryByCityName(name) {
	for (i=0; i<inventoryText.length; i++) {
		if (inventoryText[i][1] == name)
			return inventoryText[i].slice(1,2).concat(inventoryText[i].slice(4));
		}
	return [""];
}

/* function detectLinks(s) {
	var a = s.split(' ');
	for (var i=0; i<a.length; i++) {
		if (a[i].slice(0,4) == 'http') {
			var domain = a[i].split('/').slice(0,3).join('/');
			a[i] = '<a class="external" href="' + a[i] + '" target="_blank">' + domain + '...</a>';
		}
	}
	return a.join(' ');
} */ 

function fillInventoryBox(inv) {
	if (inv.length > 0) {
		$("#inv0").text(inv[0] + " policy measures");
		$("#inv1").text(inv[2]);
		$("#inv2").text(inv[3]);
		$("#inv3").text(inv[4]);
		$("#inv4").text(inv[5]);
		$("#inv5").text(inv[6]);
		$("#inv6").text(inv[7]);
		$("#inv7").text(inv[8]);
		$("#inv8").text(inv[9]);
		$("#inv9").text(inv[10]);
		$("#inv10").text(inv[11]);
		$("#inv11").text(inv[12]);
		$("#inv12").text(inv[13]);
		$("#inv13").text(inv[14]);
		$("#inv14").text(inv[15]);
		$("#inv15").text(inv[16]);
		$("#inv16").text(inv[17]);
		$("#inv17").text(inv[18]);
		$("#inv18").text(inv[19]);
		$("#inv19").text(inv[20]);
		$("#inv20").text(inv[21]);
	}
}

function getVisLayer() {
	// returns the CartoDB visualization layer
	var layers = activeVis.getLayers();
	return layers[1].getSubLayer(0);
}

function setUpMap(visjsonURL, mapSettings) {
	$("#mapContainer").append("<div id='map'></div>");
	cartodb.createVis('map', visjsonURL, mapSettings)
		.done(function(vis, layers) {
			activeVis = vis;
			// save default sql query and apply county selection if needed
			baseQuery = getVisLayer().getSQL();
			// replicate prior geo selection
			if (activeQuery) getVisLayer().setSQL(activeQuery);
			if (activeCityName) addCityOutline(activeCityName);
			
			// new code for interactivity
			$('#policy-info').draggable({
				handle: '.panel-heading',
			});
			getVisLayer().on('featureClick', function(e, latlng, pos, data) {
				$('#policy-info').show();
				fillInventoryBox(getInventoryById(data.cartodb_id));
				clearCityOutline();
				addCityOutline(getCityNameFromId(data.cartodb_id));
			});
		});
}

$('.close').click(function() {
	$('#policy-info').hide();
});

$('#layer-selector li').click(function() {
	var url = $(this).data('url');
	var lmap = activeVis.getNativeMap();
	var activeMapSettings = {
		detectRetina: true,
		center_lat: lmap.getCenter().lat,
		center_lon: lmap.getCenter().lng,
		zoom: lmap.getZoom()
	}
	activeVis.remove();
	setUpMap(url, activeMapSettings);
	resetMenu($(this));
});

$('#geo-selector li').click(function() {
	clearCityOutline();
	var geo = $(this).data('geo'); // 'city' or 'all'
	var selection = $(this).text(); // name of drop-down item
	var query = baseQuery;

	if (geo == 'city') {
		$('#policy-info').show();
		fillInventoryBox(getInventoryByCityName(selection));
		query += " WHERE name = '" + selection + "'";
		addCityOutline(selection);
		zoomToExtent(query, 1.0);
	} 
	if (geo == 'all') {
    	getVisLayer().setSQL(query)
    	zoomToExtent(query, 0);
	}
	resetMenu($(this));
});

function zoomToExtent(query, pad) {
	var sql = new cartodb.SQL({user: 'uducla'});
	sql.getBounds(query).done(function(bounds) {
        activeVis.getNativeMap().fitBounds(padBounds(bounds, pad));
    });
}

function padBounds(bounds, pad) {
	// increase bounds proportionally by pad value in all directions
	var sw_lat = bounds[0][0];
	var sw_lon = bounds[0][1];
	var ne_lat = bounds[1][0];
	var ne_lon = bounds[1][1];
	var lat = (ne_lat - sw_lat) * pad;
	var lon = (ne_lon - sw_lon) * pad;
	// shift the center to the right to avoid being blocked by policy window
	return [[sw_lat - lat, sw_lon - lon*0.5], [ne_lat + lat, ne_lon + lon*1.5]];
}

function addCityOutline(name) {
	activeCityName = name;
	activeCityOutline = activeVis.getLayers()[1].createSubLayer({
		sql: "SELECT * FROM antidisplacementlacountyreorder WHERE name = '" + name + "'",
		cartocss: '#antidisplacementlacountyreorder { line-color: #000; line-width: 2;}'
	});
}

function clearCityOutline() {
	if (activeCityOutline) activeCityOutline.remove();
	activeCityName = null;
	activeCityOutline = null;
}

function resetMenu(obj) {
	// reset selection in a pulldown menu
	obj.parent().find('.active').removeClass('active');
	obj.addClass('active');
}

function expandMap() {
	$(window).scrollTop($("#mapContainer").position().top - 15);
	var h = $(window).height() - 75;
	$("#mapContainer").height(h);
	activeVis.getNativeMap().invalidateSize();
	$(".expand-map").html('<a onclick="contractMap();" class="btn btn-primary">Smaller <span class="glyphicon glyphicon-chevron-up"></span> Map');
}

function contractMap() {
	$(window).scrollTop(0);
	$("#mapContainer").height(450);
	activeVis.getNativeMap().invalidateSize();
	$(".expand-map").html('<a onclick="expandMap();" class="btn btn-primary">Larger <span class="glyphicon glyphicon-chevron-down"></span> Map');
}

window.onload = function() {
	setUpMap(INITIAL_VISJSON_URL, INITIAL_MAP_SETTINGS);
}
