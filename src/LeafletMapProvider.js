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

      var icon = defaultIcon
      if( mapLocations[i].iconUrl !== '' ) {
        icon = L.icon({
          iconUrl: mapLocations[i].iconUrl,
          iconSize: mapSettings.markerIconSize,
          iconAnchor: mapSettings.markerIconAnchor,
          popupAnchor: settings.markerPopupAnchor,
        })
      }

      mapMarker[i] = L.marker( [mapLocations[i].latitude, mapLocations[i].longitude], {
          icon: icon,
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
              var onMarkerClickReturn = mapSettings.markerOnClickCallback( this.markerData );
              if(typeof onMarkerClickReturn === 'MapLocation') {
                mapLocations[i] = onMarkerClickReturn
              }
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
          if( mapSettings.zoomToPolylineOnClick && typeof this.markerData.references.polyline !== 'undefined') {
            map.fitBounds(this.markerData.references.polyline.getBounds())
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

    var hasBeforePolylineRenderFilter = typeof mapSettings.beforePolylineRenderFilter === 'function'
    var polylineBounds = null;

    for( var i = 0; i < mapLocations.length; i++ ) {
      if( mapLocations[i].polyline.length > 1 ) {
        var polylineData = mapLocations[i].polyline
        if( hasBeforePolylineRenderFilter ) {
          polylineData = mapSettings.beforePolylineRenderFilter( polylineData )
        }

        if( mapSettings.drawSupportPolyline ) {
          var supportPolyline = new L.Polyline( polylineData, {
            weight: mapSettings.supportPolylineWeight,
            color: mapSettings.supportPolylineColor
          })
          supportPolyline.addTo(map)
          mapLocations[i].references.supportPolyline = supportPolyline
        } 

        var polyline = new L.Polyline( polylineData, {
          weight: mapSettings.polylineWeight,
          color: (mapLocations[i].polylineColor !== '' ? mapLocations[i].polylineColor : mapSettings.polylineColor)
        })
        polyline.markerData = mapLocations[i];
        polyline.addTo(map)
        mapLocations[i].references.polyline = polyline

        // @todo make onclick DRY
        // @see setMarker()
        if(mapSettings.polylineHasOnLick) {
          mapLocations[i].references.polyline.on('click', function(e){
            if( typeof mapSettings.polylineOnClickCallback === 'function' ) {
              var onPolylineClickReturn = mapSettings.polylineOnClickCallback( this.markerData );
              if(typeof onPolylineClickReturn === 'MapLocation') {
                mapLocations[i] = onPolylineClickReturn
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
            if( mapSettings.zoomToPolylineOnClick ) {
              map.fitBounds(this.getBounds())
            }
          })
        }

        if(mapSettings.polylineHasOnMouseover) {
          mapLocations[i].references.polyline.on('mouseover', function(e){
            if( typeof this.markerData.polylineHoverColor !== 'undefined' && this.markerData.polylineHoverColor !== '') {
              this.setStyle({
                color: this.markerData.polylineHoverColor
              })
            }
          })
  
          mapLocations[i].references.polyline.on('mouseout', function(e){
            if(this.markerData.flags.applyDefaultPolylineColorOnHoverOut) {
              this.setStyle({
                color: (this.markerData.polylineColor !== '' ? this.markerData.polylineColor : mapSettings.polylineColor)
              })
            }
          })  
        }

        if(polylineBounds === null) {
          polylineBounds = mapLocations[i].references.polyline.getBounds();
        } else {
          polylineBounds.extend(mapLocations[i].references.polyline.getBounds());
        }
      }
    }

    if( polylineBounds !== null && mapSettings.polylineFitBounds === true ) {
      map.fitBounds(polylineBounds);
    }

    return mapLocations
  };

  app.showMarker = function(markerIndex, markerId, mapSettings) {
      if( mapMarker[markerIndex] && mapMarker[markerIndex].markerData.id === markerId ) {
        mapMarker[markerIndex]._icon.style.display = "block";
        if( typeof mapMarker[markerIndex].markerData.references.polyline !== 'undefined' ) {
          // order matters here. first redraw support line 
          // and then draw the polyline on top of the support
          if( mapSettings.drawSupportPolyline && typeof mapMarker[markerIndex].markerData.references.supportPolyline !== 'undefined') {
            map.addLayer(mapMarker[markerIndex].markerData.references.supportPolyline)
          }
          map.addLayer(mapMarker[markerIndex].markerData.references.polyline)
        }
      }
  };

  app.hideMarker = function(markerIndex, markerId, mapSettings) {
    if( mapMarker[markerIndex] && mapMarker[markerIndex].markerData.id === markerId ) {
      mapMarker[markerIndex]._icon.style.display = "none";
      if( typeof mapMarker[markerIndex].markerData.references.polyline !== 'undefined' ) {
        if( mapSettings.drawSupportPolyline && typeof mapMarker[markerIndex].markerData.references.supportPolyline !== 'undefined') {
          map.removeLayer(mapMarker[markerIndex].markerData.references.supportPolyline)
        }
        map.removeLayer(mapMarker[markerIndex].markerData.references.polyline)
      }
    }
  };

  return app;
})();