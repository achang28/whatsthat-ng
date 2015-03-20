angular.module('common', ['supersonic','Directives','Filters','firebase','ngMaterial'
                        ,'Services','TestData'])
  .run(['$firebaseObject','$q','$rootScope','FB','Host','Nav','Position','Profile'
        ,'supersonic','Watcher','$templateCache', function($firebaseObject,$q
        ,$rootScope,FB,Host,Nav,Position,Profile,supersonic,Watcher,$templateCache) {
    var thisView = Nav.parseViewName(steroids.view.location);
    var qUid = $q.defer();
    var _userInfo;

    //initilize stuff for ALL views
    Host.setHostSource(1);

    angular.extend($rootScope, {
      currentGeoPoint: {
        lat: 0.0,
        long: 0.0,
        latitude: 0.0,
        longitude: 0.0
      },
      qUserInfo: $q.defer()
    });

    // if current view is Auth, defer to Auth's .run()
    if (thisView == "auth")
      return;
    // check if user is authenticated
    var authInfo = Profile._getParam("fBAuthRef").$getAuth();
    
    if (authInfo != null) {
      var uid = Profile.substrUid(authInfo.uid);
      var userRef = FB.getRef().child('users').child(uid);
      $firebaseObject(userRef).$loaded().then(function(userInfo) {
        Profile._setParam("userInfo", _userInfo = userInfo);
        $rootScope.qUserInfo.resolve(userInfo);
      }, function(err) {
        $rootScope.qUserInfo.reject(err);
      });
    } else {
      Nav.enterView("auth", {
        name: "replace",
        method: supersonic.ui.layers.replace
      });
    }

    $templateCache.put("menu.html", '<md-bottom-sheet><div menu></div></md-bottom-sheet>');
  }]);

angular.module('Filters', [])
  .filter('timeAgo', function() {
    return function(timestamp) {
      return moment(timestamp).fromNow();
    };
  });

angular.module('Services', ['ngSanitize'])
  .factory('FB', function() {
    /*********************************************************
    ********************************************************/
    
    var _fbRef = new Firebase("https://whatsthat.firebaseio.com");

    /*********************************************************
    ********************************************************/
    
    return {
      getRef: function() {
        return _fbRef;
      }
    };
  })
  .factory('Host', function($http, $q) {
    var _protocols = ["http","https"]
      ,_bucket = "whatsthat"
      ,_hostnames = ["://127.0.0.1","://s3-us-west-1.amazonaws.com/"]
      ,_ports = [3000, ""];

    var _hostSource;

    return {
      setHostSource: function(hostSourceSelection) {
        _hostSource = hostSourceSelection;
      },

      getHostURL: function(source) {
        var baseURL = _protocols[_hostSource || source] +_hostnames[_hostSource || source]
        var port = _ports[_hostSource || source];
        var fullPath = baseURL +( (typeof port == "number") ? ":" +port : "" );
        return fullPath;
      },

      buildFilepath: function(model, size) {
        var size = size || "";
        // var filepath = this.getHostURL() +_bucket +"" +model +size +"/" +direction +"/";
        var filepath = this.getHostURL() +_bucket +"/" +model +"/" +size +"/";
        return filepath;
      },

      retrieveS3Policy: function() {
        var qS3Policy = $q.defer();

        $http({
          url: 'http://towimg.martiangold.com/s3-upload.php?bucket=whatsthat',
          method: "GET",
          data: {"bucket": "whatsthat"},
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }).success(function(data, status, headers, config) {
          qS3Policy.resolve(data);
        }).error(function(data, status, headers, config) {
          qS3Policy.reject(data);
        });

        return qS3Policy.promise;
      },

      uploadFile: function(fileURL, destination) {

      }
    };
  })
  .factory("Item", ['$firebaseObject', '$q', 'FB', 'Profile', 'Util',
                  function($firebaseObject, $q, FB, Profile, Util) {
    var _items, _item;
    var _rootRef = FB.getRef();

    return {
      _getItem: function(itemId) {
        if (arguments.length == 0) return _item;
        else return _.findWhere(_items, {$id: itemId});
      },

      _getItems: function(itemIds) {
        if (arguments > 0) {
          return _.filter(_items, function(item) {
            return _.contains(itemIds, item.$id);
          });
        } else
          return _items;
      },

      _addItem: function(item) {
        _items.push(item);
      },

      _setItem: function(item) {
        _item = item;
      },

      _setItems: function(items) {
        _items = items;
      },

      generateImgId: function(timestamp,userId,fileType) {
        return timestamp +"-" +userId +"." +fileType;
      },


      /******************* A D D    I T E M *******************
      *********************************************************
      ********************************************************/
      publishItem: function(newItem) {
        var itemsRef = _rootRef.child("items");
        return itemsRef.push(newItem, function(err) {
          console.log(err ? err : "Successfully Set");
        });
      },
      /********************************************************
      *********************************************************
      ********************************************************/

      refreshPicParams: function() {
        return {
          dbReord: {
            created: null,
            geoPoint: null
          },
          file: null,
          isSet: false
        };
      },

      retrieveItem: function(itemChild) {
        var qItem = $q.defer();
        
        /****************** G E T  (1)  I T E M *****************
        *********************************************************
        ********************************************************/
        $firebaseObject( itemChild.ref() ).$loaded().then(function(item) {
          qItem.resolve(item);
        }, function(error) {
          console.log(error);
        });
        /********************************************************
        *********************************************************
        ********************************************************/

        return qItem.promise;
      },

      retrieveItems: function() {
        _items = [];

        var itemsRef = _rootRef.child("items"); // line 58
        var qItems = $q.defer();
        var cnt = 0;
        var self = this;
        
        /**************** G E T  (M)  I T E M S ****************
        *********************************************************
        ********************************************************/
        itemsRef.once('value', function(itemList) {
          var itemList = Array.prototype.slice.call( itemList.val() );
          var itemCount = itemList.length;

          itemsRef.on('child_added', function(itemChild) {
            self.retrieveItem(itemChild).then(function(item) {
              _items.push(item);
              
              if (++cnt >= itemCount)
                qItems.resolve(_items);
            });
          });
        });
        /********************************************************
        *********************************************************
        ********************************************************/

        return qItems.promise;
      }
    }
  }])
  .factory("Nav", ['$filter','$q','Position','Profile','supersonic','Watcher'
                  , function($filter,$q,Position,Profile,supersonic,Watcher) {
    var _buttons, _buttonNames, _views;
    var _preloadViews = [], _qPreloadViews = [];
    var _subViews, _subViewNames;
    var _widgets, _widgetNames;

    return {
      buildOnTapOptions: function(channelName, destType, method, content) {
        return {
          channelName: channelName,
          destType: destType,
          method: method,
          params: {
            sender: this.parseViewName(steroids.view.location),
            content: content
          }
        }
      },

      modalOnTapOptions: function(targetSubView) {
        var modalOnTapOptions = this.buildOnTapOptions(
          "modalData"
          , "modal"
          , supersonic.ui.modal.show
          , { targetSubView: targetSubView, geoPoint: Position.getGeoPoint()}
        );

        return modalOnTapOptions;
      },

      enterView: function(targetViewName, options) {
        var self = this;

        if (options.destType == "root" || options.destType == "initial") { // summary view
          options.method(options.animation);
          return;
        }

        this.getView(targetViewName).then(function(view) {
          // setup ONGOING listener for TowReq being ready
          var unsubscribe = supersonic.data.channel(targetViewName +"Ready").subscribe( function() {
            if (options.destType == "modal") {
              if ( angular.isDefined(options.animation) )
                options.method(view, options.animation);
              else
                options.method(view);
            } else if (options.destType == "pillar")
              options.method(view);

            unsubscribe();
          });

          if (options.publish != null)
            options.publish();

          _qPreloadViews[targetViewName].promise.then(function() {
            supersonic.data.channel(options.channelName).publish(options.params);
          });
        });
      },

      exitView: function(viewName, actionCb) {
        _.forIn(Watcher._getUnWatchers(), function(unwatcher, index) {
          unwatcher();
        });

        Watcher.resetUnWatchers();
        actionCb();
      },

      getButton: function(btnName) {
        return _.findWhere(_buttons, {"name": btnName});
      },

      getButtons: function() {
        return _buttons;
      },

      _getSubViews: function() {
        return _subViews;
      },

      _getWidgets: function() {
        return _widgets;
      },

      getView: function(viewName) {
        var qView = $q.defer();

        supersonic.ui.views.find(this.locationify(viewName)).then(function(foundView) {
          qView.resolve(foundView);
        }, function() {
          // no view found
          var _view = _.findWhere(_views, {id: viewName});
        
          if (!_view)
            _view = _views[viewName] = this.setupView(viewName);
          qView.resolve(view);
        });

        return qView.promise;
      },

      initButtons: function(btnName, filename, side, rank, setupCb) {
        return {
          filename: filename,
          name: btnName,
          side: side,
          rank: rank,
          navBtn: setupCb(btnName, filename)
        };
      },

      // start views
      initPreloadView: function(preloadView) {
        _preloadViews.push(preloadView);
      },

      initSubViews: function(subViews) {
        _subViews = new Array(subViews.length);
        _subViewNames = subViews;

        _.forIn(subViews, function(subView, key) {
          _subViews[subView] = false;
        });
      },

      initWidgets: function(widgets) {
        _widgets = new Array(widgets.length);
        _widgetNames = widgets;
        _.forIn(widgets, function(subView, key) {
          _widgets[subView] = false;
        });
      },

      locationify: function(viewName) {
        return viewName +"#" +viewName;
      },

      logout: function() {
        var self = this;
        var fBAuthRef = Profile._getParam("fBAuthRef");

        fBAuthRef.$unauth();
        self.enterView("auth", {
          animation: supersonic.ui.animate("flipHorizontalFromRight", { duration: 0.3 }),
          destType: "initial",
          method: supersonic.ui.initialView.show
        });
      },

      parseViewName: function(viewUrl) {
        var beg = viewUrl.lastIndexOf('/') +1;
        var end = viewUrl.lastIndexOf('.');
        return viewUrl.slice(beg, end);
      },

      removeView: function(actionCb) {
        actionCb();
      },

      resetSubViews: function(subViews) {
        _.each(_subViewNames, function(subViewName) {
          _subViews[subViewName] = false;
        });
      },

      resetWidgets: function(widgetNames) {
        _.each(widgetNames, function(widgetName) {
          _widgets[widgetName] = false;
        });
      },

      setButtons: function(buttons) {
        _buttons = buttons;
        _buttonNmaes = buttons;
      },

      setButton: function(button) {
        _buttons.push(button);
      },

      setupButton: function(btnName, filename) {
        var navBtn = new steroids.buttons.NavigationBarButton();
        navBtn.imagePath = "/icons/" +filename;
        navBtn.styleClass = "super-navbar-button";
        return navBtn;
      },

      setupView: function(viewName) {
        return new supersonic.ui.View({
          location: this.locationify(viewName),
          id: viewName
        });
      },

      startView: function(preloadView) {
        _qPreloadViews[preloadView] = $q.defer();

        this.getView(preloadView).then(function(view) {
          view.isStarted().then(function(startStatus) {
            if (!startStatus) {
              view.start();
              var unsubscribeDOMReady = supersonic.data.channel("DOMReady").subscribe( function() {
                unsubscribeDOMReady();
                _qPreloadViews[preloadView].resolve();
              });
            } else {
              _qPreloadViews[preloadView].resolve();
            }
          });
        });
      },

      switchSubView: function(subViewName) {
        this.resetSubViews(_subViews);
        _subViews[subViewName] = true;
      },

      switchWidget: function(widgetName) {
        this.resetWidgets(_widgetNames);
        _widgets[widgetName] = true;
      },

      toggleSubView: function(subViews) {
        var nextSubView = "";
        _.forIn(subViews, function(state, subViewName) {
          if (state == false) {
            nextSubView = subViewName;
          }
        })

        this.switchSubView(nextSubView);
      },

      toggleWidget: function(widgets) {
        var nextWidget = "";
        _.forIn(_widgets, function(state, WidgetName) {
          if (state == false) {
            nextWidget = widgetName;
          }
        })

        this.switchWidget(nextWidget);
      }
    }
  }])
  .factory('Position', ['$q', function($q) {
    var _currentGeoPoint = {
      lat: 0.0,
      long: 0.0,
      latitude: 0.0,
      longitude: 0.0,
      timestamp: moment().format()
    };

    return {
      getGeoPoint: function() {
        return _currentGeoPoint;
      },

      _setGeoPoint: function(newGeoPoint) {
        _currentGeoPoint = newGeoPoint;
      }
    };
  }])
  .factory('Profile', ['$q','$filter','$firebaseArray','$firebaseAuth','$rootScope'
                      ,'FB',function($q,$filter,$firebaseArray,$firebaseAuth
                      ,$rootScope,FB) {
    var _params = new Array(10);
    _params["fBAuthRef"] = $firebaseAuth(FB.getRef());
    _params["rememberMe"] = null;
    _params["myOrgTypeId"] = null;
    _params["myEmployerId"] = null;
    _params["userInfo"] = null;
    _params["sites"] = new Array(2); // 0 = vendors, 1 = clients
    _params["colors"] = ['calm', 'assertive'];

    function _retrieveSites(siteIds, orgTypeId) {
      var qSites = $q.defer();
      var orgTypeName = profileService.getOrgTypeName(orgTypeId);

      $firebaseArray( FB.getRef().child(orgTypeName) ).$loaded()
        .then(function(results) {
          var sites = _.filter(results, function(site) {
            return _.contains(siteIds, site.$id)
          })

          results = null;
          qSites.resolve(sites);
        });

      return qSites.promise;
    }

    var profileService = {
      _addSite: function(orgTypeId, site) {
        _params["sites"][orgTypeId].push(site);
      },

      _getParam: function(param) {
        return _params[param];
      },

      _setParam: function(param, data) {
        _params[param] = data;
      },

      _getSites: function(orgTypeId) {
        return _params["sites"][orgTypeId];
      },
      
      _setSites: function(orgTypeId, data) {
        _params["sites"][orgTypeId] = data;
      },

      _themeColors: function(myOrgTypeId) {
        return _params["themeColors"][myOrgTypeId];
      },

      findActiveAccessRights: function(userInfo) {
        // find and set all partyIds
        var activeAccessRights = _.where(userInfo.accessRights, {'isActive': true});
        return activeAccessRights;
      },

      getFbUserInfo: function(fbUserRef) {
        return fbUserRef.$asObject().$loaded();
      },

      getOrgTypeName: function(orgTypeId) {
        var orgTypeName = $filter('orgType')(orgTypeId, "name").toLowerCase();
        return orgTypeName;
      },

      retrieveIds: function(objects, idKey) {
        return _.uniq( _.pluck(objects, idKey) );
      },

      retrieveSite: function(siteId, orgTypeName) {
        var fbSiteRef = FB.getRef().child(orgTypeName).child(siteId);
        return $firebaseObject(fbSiteRef).$loaded();
      },        

      retrieveSites: function(siteIds, orgTypeId) {
        /*
        ** Need to redo this function!!!
        */
        var qSites = $q.defer();
        var orgTypeName = this.getOrgTypeName(orgTypeId);

        $firebaseArray( FB.getRef().child(orgTypeName) ).$loaded()
          .then(function(results) {
            var sites = _.filter(results, function(site) {
              return _.contains(siteIds, site.iid);
            });

            results = null;
            qSites.resolve(sites);
          });

        return qSites.promise;
      },

      setupRequiredSites: function(myOrgTypeId, myEmployerId) {
        // WHO DO I WORK FOR
        // WHO ARE MY CLIENTS

        var self = this;
        var qSites = new Array(2); // vendor + client
        var siteIdsByMyOrgType;
        // var myEmployerId = _params["myEmployerId"];
        // var myOrgTypeId = _params["myOrgTypeId"];
        var constituentOrgTypeId = this.toggleOrgTypeId(myOrgTypeId).toString();
        qSites[ORGTYPE_CONST.VENDOR] = $q.defer(), qSites[ORGTYPE_CONST.CLIENT] = $q.defer();

        if (myEmployerId) {
          siteIdsByMyOrgType = [myEmployerId];
        } else {
          // accessRights used to extrapolate siteIds of employer
          var activeARs = this.findActiveAccessRights(_params["userInfo"]);
          var activeARsByMyOrgType = _.where(activeARs, {orgTypeId: myOrgTypeId});
          siteIdsByMyOrgType = this.retrieveIds(activeARsByMyOrgType, 'siteId');  
        }
        
        // retrieve sites of myOrgType (employer)
        this.retrieveSites(siteIdsByMyOrgType, myOrgTypeId)
          .then(function(employerSites) {
            self._setSites(myOrgTypeId, employerSites);
            return employerSites;
          })
          .then(function(employerSites) {
            if (!$rootScope.myEmployerId) {
              self._setParam("myEmployerId", myEmployerSite.$id);
              _params["userInfo"].state.employerId = myEmployerSite.$id;
              _params["userInfo"].$save();
            }

            // auto-select 1st employer site
            var myEmployerSite = _.first(employerSites);
            self._setSites(myOrgTypeId, [myEmployerSite]);
            qSites[myOrgTypeId].resolve(myEmployerSite);
          });
        
        qSites[myOrgTypeId].promise.then(function(myEmployerSite) {
          var constituentOrgTypeName = self.getOrgTypeName(constituentOrgTypeId);
          var constituentSiteRefs = myEmployerSite[constituentOrgTypeName]; // don't filter 'inactive' sites just yet
          var constituentSiteIds = self.retrieveIds(constituentSiteRefs, 'id');
          
          self.retrieveSites(constituentSiteIds, constituentOrgTypeId)
            .then(function(constituentSites) {
              self._setSites(constituentOrgTypeId, constituentSites);
              return constituentSites;
            })
            .then(function(constituentSites) {
              self._setSites(constituentOrgTypeId, constituentSites);
              qSites[constituentOrgTypeId].resolve(constituentSites);
            });
        });
        
        return qSites[constituentOrgTypeId].promise;
      },

      substrUid: function(uid) {
        return uid.substr(uid.lastIndexOf(':') + 1);
      },

      toggleOrgTypeId: function(orgTypeId) {
        return Math.abs(parseInt(orgTypeId) - 1).toString();
      }
    };

    return profileService;
  }])
  .factory("Storage", function() {
    return {
      getParam: function(item) {
        return localStorage.getItem(item);
      },
      setParam: function(item, value) {
        localStorage.setItem(item, value);
      }
    }
  })
  .factory('User', ['$firebaseObject','$q','FB','Profile',function($firebaseObject
                  ,$q,FB,Profile) {
    var _user;

    return {
      getUser: function(userId) {
        return _.findWhere(_users, {"uid": userId});
      },

      retrieveUser: function(userChild) {
        var qUser = $q.defer();
        $firebaseObject( userChild.ref() ).$loaded().then(function(user) {
          qUser.resolve(user);
        }, function(error) {
          console.log(error);
        });

        return qUser.promise;
      },

      setUser: function(user) {
        _user = user;
      }
    };
  }])
  .factory('Util', function() {
    return {
      changeToNull: function(records, targetParam) {
        _.each(records, function(record) {
          if (record[targetParam] == "")
            record[targetParam] = null;
        });
      },

      compareIntValues: function(a, b) {
        return (parseInt(a) === parseInt(b)) ? true : false;
      },

      convertId: function(id) {
        var intId = parseInt(id);
        return (typeof intId === "number") ? intId : id;
      },

      getObjLength: function(obj) {
        return parseInt(obj.length);
      },

      trimString: function(slug, unwantedLetter) {
        return slug.substr(0, slug.lastIndexOf(unwantedLetter));
      },

      valueToUpper: function(obj) {
        return obj.toUpperCase(obj);
      },
    }
  })
  .factory("Watcher", function() {
    var _unwatchers = [];

    return {
      _getUnWatchers: function() {
        return _unwatchers;
      },

      _setUnWatcher: function(unwatcher) {
        _unwatchers.push(unwatcher);
      },

      resetUnWatchers: function() {
        _unwatchers = null;
        _unwatchers = [];
      }
    }
  })

angular.module('TestData', [])
  .factory('UserData', ['$firebaseObject','$q','FB',function($firebaseObject,$q,FB) {
    var _users = [
      {
        uid: "1",
        email: 'jpriebe@whatsthat.com',
        password: 'jpriebe',
        firstName: 'Jeffrey',
        lastName: 'Priebe',
        filename: "jpriebe.jpg"
      }, {
        uid: "2",
        email: 'aettinger@whatsthat.com',
        password: 'aettinger',
        firstName: 'Anthony',
        lastName: 'Ettinger',
        filename: "aettinger.png"
      }
    ];
    
    return {
      getUser: function(userId) {
        return _.findWhere(_users, {"uid": userId});
      },
      getUsers: function() {
        var qUsers = $q.defer();

        if (!_users)
          retrieveUsers().then(function(users) {
            qUsers.resolve(_users = users);
          });
        else
          qUsers.resolve(_users);

        return qUsers.promise;
      },
      retrieveUser: function(userChild) {
        var qItem = $q.defer();
        $firebaseObject( itemChild.ref() ).$loaded().then(function(item) {
          qItem.resolve(item);
        }, function(error) {
          console.log(error);
        });

        return qItem.promise;
      },

      retrieveUsers: function() {
        // reset items array
        _users = [];

        // get list of all site Ids
        var usersRef = _rootRef.child("users");
        var qUsers = $q.defer();
        var cnt = 0;
        var self = this;

        usersRef.once('value', function(usersList) {
          var itemList = Array.prototype.slice.call( itemList.val() );
          var itemCount = itemList.length;

          itemsRef.on('child_added', function(itemChild) {
            self.retrieveItem(itemChild).then(function(item) {
              _items.push(item);
              
              if (++cnt >= itemCount)
                qItems.resolve(_items);
            });
          });
        });

        return qItems.promise;
      }
    };
  }])