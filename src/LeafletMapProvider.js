window.LeafletMapProvider = (function () {
  var _init = false;
  var app = {};
  var map = false;
  var tileLayer = false;
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
  var defaultIcon = false;

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

    defaultIcon = L.icon({
      iconUrl: mapSettings.markerImagePath,
      iconSize: mapSettings.markerIconSize,
      iconAnchor: mapSettings.markerIconAnchor,
      popupAnchor: settings.markerPopupAnchor,
    });

  };

  app.setMarker = function( mapLocations, mapSettings ) {

    var bounds = null;
    
    for( var i = 0; i < mapLocations.length; i++ ) {
      var location = mapLocations[i]
      mapLocations[i].references.marker = setSingleMarker(
        location.latitude,
        location.longitude,
        location.infowindow,
        location.iconUrl,
        location,
        i,
        mapSettings
      )
      bounds = extendMarkerBounds(bounds, mapLocations[i].references.marker)

      if(mapLocations[i].additionalMarkers.length > 0) {
        mapLocations[i].additionalMarkers.forEach( function(marker){
          if( typeof marker.latitude !== 'undefined' && typeof marker.longitude !== 'undefined') {
            var iconUrl = marker.iconUrl || ''
            var leafletMarker = setSingleMarker(
              marker.latitude,
              marker.longitude,
              mapLocations[i].infowindow,
              iconUrl,
              mapLocations[i],
              i,
              mapSettings
            )
            bounds = extendMarkerBounds(bounds, leafletMarker)
            mapLocations[i].references.additionalMarkers.push(leafletMarker)
          }
        })
      }
      
    }
    if( mapSettings.mapUseFirstMarkerAsCenter === true ) {
      map.panTo(new L.LatLng(mapLocations[0].latitude, mapLocations[0].longitude), mapSettings.mapDefaultZoom);
    }
    if( mapSettings.markerFitBounds === true ) {
      map.fitBounds(bounds);
    }
    return mapLocations;
  };

  var setSingleMarker = function( latitude, longitude, infowindow, iconUrl, mapLocation, mapLocationIndex, mapSettings ) {
    var icon = defaultIcon
    if( iconUrl !== '' ) {
      icon = L.icon({
        iconUrl: iconUrl,
        iconSize: mapSettings.markerIconSize,
        iconAnchor: mapSettings.markerIconAnchor,
        popupAnchor: settings.markerPopupAnchor,
      })
    }

    var marker = L.marker( [latitude, longitude], {
        icon: icon,
    }).addTo(map);

    marker.markerData = mapLocation;

    if( mapSettings.showInfoWindow && infowindow !== '' ) {
      marker.bindPopup(infowindow);
    }
    if( mapSettings.markerHasOnClick || mapSettings.showInfoWindow ) {
      marker.on('click', function() {
        if( mapSettings.markerHasOnClick ) {
          if( typeof mapSettings.markerOnClickCallback === 'function' ) {
            var onMarkerClickReturn = mapSettings.markerOnClickCallback( this.markerData );
            if(typeof onMarkerClickReturn === 'MapLocation') {
              mapLocations[mapLocationIndex] = onMarkerClickReturn
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

    return marker
  }

  var extendMarkerBounds = function(bounds, marker) {
    if(bounds === null) {
      bounds = L.latLngBounds(marker.getLatLng(), marker.getLatLng());
    } else {
      bounds.extend(marker.getLatLng());
    }
    return bounds
  }

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
              if(this.markerData.references.supportPolyline !== null) {
                this.markerData.references.supportPolyline.bringToFront()
              }
              this.bringToFront()
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

  app.showMarker = function(mapLocation, markerIndex, markerId, mapSettings) {
      if( mapLocation && mapLocation.id === markerId ) {
        mapLocation.references.marker._icon.style.display = "block";
        if(mapLocation.references.polyline !== null ) {
          // order matters here. first redraw support line 
          // and then draw the polyline on top of the support
          if( mapSettings.drawSupportPolyline && mapLocation.references.supportPolyline !== null) {
            map.addLayer(mapLocation.references.supportPolyline)
          }
          map.addLayer(mapLocation.references.polyline)
        }
      }
  };

  app.hideMarker = function(mapLocation, markerIndex, markerId, mapSettings) {
    if( mapLocation && mapLocation.id === markerId ) {
      mapLocation.references.marker._icon.style.display = "none";
      if(mapLocation.references.polyline !== null) {
        if( mapSettings.drawSupportPolyline && mapLocation.references.supportPolyline !== null) {
          map.removeLayer(mapLocation.references.supportPolyline)
        }
        map.removeLayer(mapLocation.references.polyline)
      }
    }
  };

  return app;
})();