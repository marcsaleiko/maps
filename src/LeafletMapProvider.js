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
    map = L.map(mapElement).setView(mapSettings.mapDefaultCenter, mapSettings.mapDefaultZoom);

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

  app.setMarker = function( marker, mapSettings ) {

    var defaultIcon = L.icon({
      iconUrl: mapSettings.markerImagePath,
      iconSize: mapSettings.markerIconSize,
      iconAnchor: mapSettings.markerIconAnchor,
      popupAnchor: settings.markerPopupAnchor,
    });

    var latLngBounds = [];
    for( var i = 0; i < marker.length; i++ ) {

      mapMarker[i] = L.marker( [marker[i].latitude, marker[i].longitude], {
          icon: defaultIcon,
      }).addTo(map);

      latLngBounds.push([marker[i].latitude, marker[i].longitude]);
      mapMarker[i].markerData = marker[i];

      if( mapSettings.showInfoWindow && typeof marker[i].infowindow !== 'undefined' && marker[i].infowindow !== '' ) {
        mapMarker[i].bindPopup(marker[i].infowindow);
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
    }
    if( mapSettings.markerFitBounds === true ) {
      map.fitBounds(L.latLngBounds(latLngBounds));
    }
  };

  return app;
})();