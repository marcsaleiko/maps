window.LeafletMapProvider = (function () {
  var _init = false;
  var app = {};
  var map = false;
  var tileLayer = false;
  var mapMarker = [];
  var hasRemoteLibraryToLoad = false;
  var settings = {
    // accepts "normal" or "wms"
    tileLayerType: 'normal',
    tileLayerUrl: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    markerPopupAnchor: [0, -40],
    zoomControl: true,
    scrollWheelZoom: true, 
  };

  app.init = function( options ) {
    if( _init ) {return; }
    _init = true;
    settings = Object.assign(settings, options);
  };

  app.hasRemoteLibraryToLoad = function(){
    return hasRemoteLibraryToLoad;
  };

  app.initMap = function( mapElement, mapSettings ) {
    map = L.map(mapElement, {
      zoomControl: settings.zoomControl,
      scrollWheelZoom: settings.scrollWheelZoom,
      dragging: !L.Browser.mobile,
    }).setView(mapSettings.mapDefaultCenter, mapSettings.mapDefaultZoom);

    if( settings.tileLayerType === 'normal' ) {
      tileLayer = L.tileLayer(settings.tileLayerUrl, settings.tileLayerOptions ).addTo(map);
    }
    else if (settings.tileLayerType === 'wms' ) {
      tileLayer = L.tileLayer.wms(settings.tileLayerUrl, settings.tileLayerOptions).addTo(map);
    }
    else {
      console.error('LeafletMapProvider: tileLayerType '+settings.tileLayerType+' does not have an implementation.');
    }

  };

  app.setMarker = function( mapLocations, mapSettings ) {

    var defaultIcon = L.icon({
      iconUrl: mapSettings.markerImagePath,
      iconSize: mapSettings.markerIconSize,
      iconAnchor: mapSettings.markerIconAnchor,
      popupAnchor: settings.markerPopupAnchor,
    });

    var latLngBounds = [];
    for( var i = 0; i < mapLocations.length; i++ ) {

      mapMarker[i] = L.marker( [mapLocations[i].latitude, mapLocations[i].longitude], {
          icon: defaultIcon,
      }).addTo(map);

      latLngBounds.push([mapLocations[i].latitude, mapLocations[i].longitude]);
      mapMarker[i].markerData = mapLocations[i];

      if( mapSettings.showInfoWindow && typeof mapLocations[i].infowindow !== 'undefined' && mapLocations[i].infowindow !== '' ) {
        mapMarker[i].bindPopup(mapLocations[i].infowindow);
      }
      if( mapSettings.markerHasOnClick || mapSettings.showInfoWindow ) {
        mapMarker[i].on('click', function() {
          if( mapSettings.markerHasOnClick ) {
            if( typeof mapSettings.markerOnClickCallback === 'function' ) {
              mapSettings.markerOnClickCallback( this );
            }
          }
          if( mapSettings.showInfoWindow ) {
            var infoWindowBody = '';
            if( typeof this.markerData.infowindow !== 'undefined' && this.markerData.infowindow !== '' ) {
              infoWindowBody = this.markerData.infowindow;
            }
            if( typeof mapSettings.markerInfoWindowBodyFilter === 'function' ) {
              infoWindowBody = mapSettings.markerInfoWindowBodyFilter( this, infoWindowBody );
            }
            if( infoWindowBody !== '' ) {
              this.bindPopup(infoWindowBody);
              this.openPopup();
            }
          }
        });
      }
      mapLocations[i].references.marker = mapMarker[i];
    }
    if( mapSettings.mapUseFirstMarkerAsCenter === true ) {
      map.panTo(new L.LatLng(mapLocations[0].latitude, mapLocations[0].longitude), mapSettings.mapDefaultZoom);
    }
    if( mapSettings.markerFitBounds === true ) {
      map.fitBounds(L.latLngBounds(latLngBounds));
    }
    return mapLocations;
  };

  app.setPolylines = function( mapLocations, mapSettings ) {
    console.log(mapLocations);

    var hasBeforePolylineRenderFilter = typeof mapSettings.beforePolylineRenderFilter === 'function';

    for( var i = 0; i < mapLocations.length; i++ ) {
      if( mapLocations[i].polyline.length > 1 ) {
        var polylineData = mapLocations[i].polyline;
        if( hasBeforePolylineRenderFilter ) {
          polylineData = mapSettings.beforePolylineRenderFilter( polylineData );
        }

        var polyline = new L.Polyline( polylineData, {
          weight: mapSettings.polylineWeight,
          color: (mapLocations[i].polylineColor !== '' ? mapLocations[i].polylineColor : mapSettings.polylineColor)
        });
        polyline.addTo(map);
        mapLocations[i].references.polyline = polyline;
      }
    }

    console.log(mapLocations);

    return mapLocations;
  };

  app.showMarker = function(markerIndex, markerId) {
      if( mapMarker[markerIndex] && mapMarker[markerIndex].markerData.id === markerId ) {
        mapMarker[markerIndex]._icon.style.display = "block";
      }
  };

  app.hideMarker = function(markerIndex, markerId) {
    if( mapMarker[markerIndex] && mapMarker[markerIndex].markerData.id === markerId ) {
      mapMarker[markerIndex]._icon.style.display = "none";
    }
  };

  return app;
})();