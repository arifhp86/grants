// Case insensative 'contains' jquery
jQuery.expr[':'].contains = function(a, i, m) {
  return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

var mapStyles = [
  {
      "featureType": "administrative",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#444444"
          }
      ]
  },
  {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [
          {
              "color": "#f2f2f2"
          }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "road",
      "elementType": "all",
      "stylers": [
          {
              "saturation": -100
          },
          {
              "lightness": 45
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
          {
              "color": "#edc200"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#000000"
          }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels.text.stroke",
      "stylers": [
          {
              "color": "#ffffff"
          },
          {
              "visibility": "simplified"
          }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "all",
      "stylers": [
          {
              "color": "#f5a301"
          },
          {
              "visibility": "on"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
          {
              "color": "#000000"
          }
      ]
  },
  {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  }
];

// Mixitup
var filter = {
  init: function() {
    var self = this;
    this.mixer = mixitup('.grants-list', {
      selectors: {
        target: '.grant-item'
      }
    });

    this.$filters = $('.filters');
    this.filters = [];
    this.elements = Array.prototype.slice.call(document.querySelectorAll('.grant-item'));
    this.hiddenElements = this.elements.slice(21);
    this.hiddenElements.forEach(function(item) {
      item.style.display = 'none';
    });

    this.$searchInput = this.$filters.find('.filter-search input');
    this.searchKeyword = '';

    this.yearFrom = document.getElementById('year-from');
    this.yearTo = document.getElementById('year-to');

    this.markerIcon = {
      url: 'images/marker.png',
      size: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 32)
    };
    this.markerIconAlt = {
      url: 'images/marker-alt.png',
      size: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 32)
    };
    this.focusedMarker = null;

    this.infoWindow = new google.maps.InfoWindow();

    this.addEvents();
    this.initMap();
  },

  initMap: function() {
    var self = this;
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -25.354706, lng: 133.717515},
      zoom: 4,
      gestureHandling: 'greedy',
      styles: mapStyles
    });
    this.markers = [];
    var bounds = new google.maps.LatLngBounds();
    this.elements.forEach(function(item) {
      var position = new google.maps.LatLng(+item.getAttribute('data-lat'), +item.getAttribute('data-lng'));
      var marker = new google.maps.Marker({
        position: position,
        map: self.map,
        icon: self.markerIcon,
        element: item
      });
      self.markers.push(marker);
      marker.addListener('click', function(e) {
        self.infoWindow.setContent(self.makeInfoWindowContent(marker.element));
        self.infoWindow.open(self.map, marker);
        self.focusMarker(marker);
      });
      bounds.extend(position);
    });

    this.map.fitBounds(bounds);
    this.addMapEvents();
  },

  focusMarker: function(marker) {
    if(this.focusedMarker) {
      this.focusedMarker.setIcon(this.markerIcon);
    }
    if(typeof marker !== 'undefined') {
      marker.setIcon(this.markerIconAlt);
      this.focusedMarker = marker;
    }
  },

  makeInfoWindowContent: function(element) {
    var $el = $(element);
    var content = '';
    content += '<h4>' + $el.find('.grant-title strong').text() + '</h4>';
    content += '<p style="max-width: 250px">' + $el.find('.grant-description').text() + '</p>';
    content += '<a href="'+$el.find('.grant-details-link').attr('href')+'">View Details</a>';
    return content;
  },

  addMapEvents: function() {
    var self = this;
    google.maps.event.addListener(this.map, 'bounds_changed', function(e) {
      if(typeof self.bounds === 'undefined') {
        self.bounds = self.map.getBounds(); // first change
      } else {
        self.bounds = self.map.getBounds();
        var elements = self.filter(self.elements, self.filters);
        if(self.searchKeyword.trim().length > 0) {
          elements = self.search(self.searchKeyword, elements);
        }
        var newElements = elements.filter(function(item) {
          var position = new google.maps.LatLng(+item.getAttribute('data-lat'), +item.getAttribute('data-lng'));
          return self.bounds.contains(position);
        });

        self.mixer.filter(newElements);
      }
    });

    google.maps.event.addListener(this.infoWindow, 'closeclick', function() {
      self.focusMarker(); // unfocus focused marker because we diden't pass anything as marker
    });
  },

  resetMarkers: function(elements) {
    var self = this;
    self.markers.forEach(function(item) {
      item.setMap(null);
    });
    self.markers = [];
    elements.forEach(function(item) {
      var position = new google.maps.LatLng(+item.getAttribute('data-lat'), +item.getAttribute('data-lng'));
      var marker = new google.maps.Marker({
        position: position,
        map: self.map,
        icon: self.markerIcon,
        element: item
      });
      marker.addListener('click', function(e) {
        self.infoWindow.setContent(self.makeInfoWindowContent(marker.element));
        self.infoWindow.open(self.map, marker);
        self.focusMarker(marker);
      });
      self.markers.push(marker);
    })
  },

  unHideElements: function() {
    if(this.hiddenElements.length) {
      this.hiddenElements.forEach(function(item) {
        item.style.display = null;
      });
      this.hiddenElements = [];
    }
  },

  calculateElement: function() {
    var self = this;
    this.filters = [];
    this.$filters.find('.filter-checkbox').each(function() {
      var group = [];
      $(this).find('input[type="checkbox"]').each(function() {
        if($(this).is(':checked')) {
          group.push($(this).val());
        }
      });
      self.filters.push(group);
    });

    if(self.yearFrom.value !== '' && self.yearTo.value !== '' && !self.isPastDate(self.yearFrom.value, self.yearTo.value)) {
      self.filters.push(self.monthYearClasses(self.yearFrom.value, self.yearTo.value));
    }
    var result = self.filter(self.elements, self.filters);
    if(self.searchKeyword.trim().length > 0) {
      result = self.search(self.searchKeyword, result);
    }
    return result;
  },

  filter: function(elArray, filters) {
    return elArray.filter(function(element) {
      return filters.every(function(filter) {
        if(filter.length === 0) return true;
        return filter.some(function(item) {
          return element.classList.contains(item);
        });
      })
    });
  },

  addEvents: function() {
    var self = this;
    this.$filters.find('input[type="checkbox"]').on('change', function() {
      self.unHideElements();
      var  result = self.calculateElement();
      self.resetMarkers(result);
      self.mixer.filter(result);
    });

    this.$filters.find('.filter-search input').on('keyup', function() {
      delay(function() {
        self.searchKeyword = self.$searchInput.val();
        if(self.searchKeyword.trim().length > 0) {
          self.unHideElements();
          var result = self.filter(self.elements, self.filters);
          result = self.search(self.searchKeyword, result);
          self.resetMarkers(result);
          self.mixer.filter(result);
        }
      }, 500);
    });
  },

  search: function(keyword, elements) {
    return elements.filter(function(element) {
      return $(element).find(':contains('+keyword+')').length > 0;
    });
  },

  monthYearClasses: function(from, to) {
    from = this.toDate(from);
    to = this.toDate(to);
    var clases = [];
    var newDate = from;
    while(newDate <= to) {
      clases.push('date-' + this.padZero(newDate.getMonth() + 1) + '_' + newDate.getFullYear().toString());
      newDate.setMonth(newDate.getMonth() + 1);
    }
    return clases;
  }, 

  toDate: function(mmyy) {
    mmyy = mmyy.split('/');
    var year = mmyy[1],
    month = mmyy[0] - 1;
    return new Date(year, month);
  },

  isPastDate: function(from, to) {
    return this.toDate(from) >= this.toDate(to);
  },

  padZero: function(num) {
    return num < 10 ? '0' + num : num;
  }
};
filter.init();


Inputmask.extendDefinitions({
    M: {
        validator: "0[1-9]|1[012]",
        cardinality: 2,
        placeholder: 'M',
        prevalidator: [{
            validator: function (chrs, maskset, pos, strict, opts) {
                var isNumeric = new RegExp("[0-9]");
                if(!isNumeric.test(chrs)) return false;
                if(chrs > "1") {
                    maskset.buffer[pos] = "0";
                    return {
                        "pos": pos+1,
                        "c": chrs,
                    };
                }
                else return true;
            },
            cardinality: 1
        }]
    },
    Y: {
        validator: "\\d{4}",
        cardinality: 4,
        placeholder: 'Y',
    }
});
Inputmask('M/Y').mask(filter.yearFrom);
Inputmask({
  mask: 'M/Y',
  oncomplete: function() {
    if(filter.yearFrom.value === '') {
      filter.yearFrom.focus();
      filter.yearTo.value = '';
    } else if(filter.isPastDate(filter.yearFrom.value, filter.yearTo.value)) {
      filter.yearTo.value = '';
    }
  }
}).mask(filter.yearTo);


$('.load-all').on('click', function(e) {
  e.preventDefault();
  filter.unHideElements();
  $(this).hide();
})











