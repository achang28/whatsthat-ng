angular.module('modal', ['common', 'ui.bootstrap'])
  .run(['$q','$rootScope','Nav','supersonic', function($q,$rootScope,Nav,supersonic) {
    var thisView = Nav.parseViewName(steroids.view.location); 
    var unsubscribe = angular.element(document).ready(function () {
      supersonic.data.channel("DOMReady").publish();
      unsubscribe();
    });
  }])
  .controller('ModalCtrl', ['$q','$rootScope','$scope','Nav','Profile','supersonic'
                        , function($q, $rootScope,$scope,Nav,Profile,supersonic) {
    var thisView = Nav.parseViewName(steroids.view.location);
    Nav.initSubViews(["create", "profile"]);
    angular.extend($scope, {
      subViews: Nav._getSubViews()
    });

    var buttons = new Array("close");
    Nav.setButtons(buttons);

    buttons[0] = Nav.initButtons('close', "close.png", "right", 1, Nav.setupButton);
    buttons[0].navBtn.onTap = function() {
      Nav.exitView(thisView, supersonic.ui.modal.hide);
    }
    
    supersonic.data.channel(thisView +"Data").subscribe( function(message) {
      var targetSubView = message.content.targetSubView
      
      $rootScope.qUserInfo.promise.then(function(userInfo) {

      });

      if ($scope.subViews[targetSubView] != true)
        Nav.switchSubView(targetSubView);

      var readyParams = {
        sender: Nav.parseViewName(steroids.view.location),
        content: {}
      };

      supersonic.data.channel(thisView +"Ready").publish(readyParams);
      steroids.view.navigationBar.show({
        title: ""
      });
      $scope.$digest();
    });
  }])
  .directive('create', function() {
    return {
      restrict: "EA",
      scope: {
        mySites: "="
      },
      template:
        // '<div>'
        // +'  <button ng-click="test(2)">Vehicle</button>'
        // +'  <button ng-click="test(1)">License Plate</button>'
        // +'</div>'
        // +'<div>{{flashMsg}}</div>'
        '<div class="row item-image">'
        +'  <span class="col col-5"></span>'

        // <!-- P I C S   I N D I C A T O R-->
        +'  <span class="col col-20">'
        +'    <i ng-show="widgets[\'pics\']" ng-class="{\'icon button-icon super-ios7-checkmark balanced\':requirements.pics,'
        +'                                              \'icon button-icon super-ios7-circle-filled\':!requirements.pics}"></i>'
        +'    <i ng-show="!widgets[\'pics\']" ng-class="{\'icon button-icon super-ios7-checkmark-outline balanced\': requirements.pics,'
        +'                                               \'icon button-icon super-ios7-circle-outline\': !requirements.pics}"'
        +'                                    ng-click="switchWidget(\'pics\')"></i>'
        +'    <p>What</p>'
        +'  </span>'
        +'  <span class="col col-5"></span>'

        // <!-- S I T E    I N D I C A T O R-->
        +'  <span class="col col-20">'
        +'    <i ng-show="widgets[\'site\']" ng-class="{\'icon button-icon super-ios7-checkmark balanced\':requirements.site,'
        +'                                              \'icon button-icon super-ios7-circle-filled\':!requirements.site}"></i>'
        +'    <i ng-show="!widgets[\'site\']" ng-class="{\'icon button-icon super-ios7-checkmark-outline balanced\': requirements.site,'
        +'                                               \'icon button-icon super-ios7-circle-outline\': !requirements.site}"'
        +'                                    ng-click="switchWidget(\'site\')"></i>'
        +'    <p>Where</p>'
        +'  </span>'
        +'  <span class="col col-5"></span>'

          // <!-- T I M E S T A M P    I N D I C A T O R-->
        +'  <span class="col col-20">'
        +'    <i ng-show="widgets[\'datetime\']" ng-class="{\'icon button-icon super-ios7-checkmark balanced\':requirements.datetime,'
        +'                                                  \'icon button-icon super-ios7-circle-filled\':!requirements.datetime}"></i>'
        +'    <i ng-show="!widgets[\'datetime\']" ng-class="{\'icon button-icon super-ios7-checkmark-outline balanced\': requirements.datetime,'
        +'                                                   \'icon button-icon super-ios7-circle-outline\': !requirements.datetime}"'
        +'                                        ng-click="switchWidget(\'datetime\')"></i>'
        +'    <p>When</p>'
        +'  </span>'
        +'  <span class="col col-5"></span>'

          // <!-- ! F I N A L I Z E   I N D I C A T O R! -->'
        +'  <span class="col col-25">'
        +'    <i ng-show="requirements.pics && requirements.site && requirements.datetime"'
        +'       ng-class="{\'icon button-icon super-ios7-cloud-upload balanced\': widgets[\'confirm\'],'
        +'                  \'icon button-icon super-ios7-cloud-upload-outline balanced\': !widgets[\'confirm\']}"'
        +'       ng-click="switchWidget(\'confirm\')"></i>'
        +'    <i ng-show="!requirements.pics || !requirements.site || !requirements.datetime"'
        +'       class="icon button-icon super-ios7-cloud-upload outline stable"></i>'
        +'    <p ng-class="{\'stable\':!requirements.pics || !requirements.site || !requirements.datetime}">Confirm</p>'
        +'  </span>'

        +'</div>'
        +'<div pics-mgr ng-if="mySites"'
        +'              ng-show="widgets[\'pics\']"'
        +'              indicator="requirements.pics"'
        +'              pic-class="list">'
        +'</div>'
        +'<div site-picker ng-if="mySites"'
        +'                 ng-show="widgets[\'site\']"'
        +'                 class="list"'
        +'                 indicator="requirements.site"'
        +'                 request="newRequest"'
        +'                 sites="sites">'
        +'</div>'
        +'<div datetime-mgr ng-if="mySites"'
        +'                  ng-show="widgets[\'datetime\']"'
        +'                  model="newRequest.firstSeen"'
        +'                  indicator="requirements.datetime">'
        +'</div>'
        +'<div ng-show="widgets[\'confirm\']">'

        +'  <div class="list">'
        +'    <span class="item item-divider">Finalize Details</span>'
        +'  </div>'
        +'  <div class="list item">'
        +'    <p class="item-body"><b>Vehicle Pictures:</b> VIN, License Plate</p>'
        +'    <p class="item-body"><b>Location:</b>{{sites.client.name}}</p>'
        +'    <p class="item-body"><b>Tow Provider:</b>{{sites.vendor.name}}</p>'
        +'    <p class="item-body"><b>First Seen:</b>{{newRequest.firstSeen | date : "medium"}}</p>'
        +'  </div>'
        +'  <label class="list item item-input">'
        +'    <textarea class="item-note"'
        +'              rows="3"'
        +'              ng-model="notes"'
        +'              placeholder="Comments...">'
        +'    </textarea>'
        +'  </label>'

        +'  <div class="list">'
        +'    <div class="item-text-wrap item-note">By clicking either of the two buttons below, you are agreeing to the <a href="#">terms</a>.</div>'
        +'    <button class="button button-block button button-calm" ng-click="submitRequest(0)"><b>Advise To Tow</b></button>'
        +'    <button class="button button-block button button-balanced" ng-click="submitRequest(1)"><b>Tow Now!</b></button>'
        +'  </div>'
        +'</div>',
      controller: ['$firebase','$http','$q','$rootScope','$scope','Host','LookupSet'
                  ,'Nav','ORGTYPE_CONST','PICTYPE_CONST','Position','Profile','Request'
                  ,'supersonic','Watcher', function($firebase,$http,$q,$rootScope
                  ,$scope,Host,LookupSet,Nav,ORGTYPE_CONST ,PICTYPE_CONST,Position
                  ,Profile,Request,supersonic,Watcher) {
        // setup Nav stuff
        var thisView = Nav.parseViewName(steroids.view.location);
        var widgetNames = ['pics','site','datetime','confirm'];

        Nav.initWidgets(widgetNames);
        Nav.switchWidget("pics");

        Request._setRequiredPicTypeIds(new Array(PICTYPE_CONST.VEHICLE, PICTYPE_CONST.LICPLATE))

        angular.extend($scope, {
          flashMsg: "tseting...",
          lookupSets: null,
          notes: "",
          newRequest: {
            iid: "",
            firstSeen: moment().toDate(),
            vendors: {
              id: ""
            },
            clients: {
              id: ""
            },
            geoPoint: null,
            pics: [],
            statuses: [],
            vehicle: {
              make: "",
              model: "",
              color: {
                hexCode: "",
                name: ""
              },
              vehicleType: {
                id: "",
                name: ""
              },
              year: "",
              drivetrain: {
                id: "",
                name: ""
              },
              transmission: {
                id: "",
                name: ""
              },
              vin: "",
              licensePlate: {
                number: "",
                state: ""
              }
            }
          },
          requirements: {
            pics: false,
            site: false,
            datetime: false
          },
          sites: {
            client: null,
            vendor: null
          },
          switchWidget: null,
          subViews: Nav._getSubViews(),
          submitRequest: function(statusId) {
            var qS3Data = $q.defer();
            statusId = statusId.toString();

            $http({
              url: 'http://towimg.martiangold.com/s3-upload.php?bucket=towmo',
              method: "GET",
              data: {"bucket": "towmo"},
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json; charset=utf-8'
              }
            }).success(function(data, status, headers, config) {
              qS3Data.resolve(data);
            }).error(function(data, status, headers, config) {
              navigator.notification.alert("No S3 Policy");
            });

            // 1. preparations prior to file upload
            var clientId = $scope.newRequest.clients.id;
            var fileTransfer = new FileTransfer();
            var orgTypeId = $rootScope.myOrgTypeId;
            var stagedPics = Request._getStagedPics();
            var timestamp = moment().format("X");
            var userId = Profile._getParam("userInfo").$id;
            var qStagedPics = $q.defer();

            _.forIn(stagedPics, function(stagedPic, index) {
              var fileToUpload = stagedPic.file.sourceFilename;
              var fileType = stagedPic.file.fileType;
              var fuOptions = new FileUploadOptions();
              var picTypeId = stagedPic.iid;

              stagedPic.dbRecord.filename = Request.generateImgId(timestamp,userId
                                          ,clientId,orgTypeId,picTypeId,fileType);
              stagedPic.dbRecord.statusId = statusId;
              
              qS3Data.promise.then(function(s3Data) {
                fuOptions.mimeType = "image/" +fileType;
                fuOptions.params = {
                  key: "requests/vehicle/base/" +stagedPic.dbRecord.filename,
                  acl: 'public-read',
                  'Content-Type': "image/" +stagedPic.file.fileType,
                  AWSAccessKeyId: s3Data.key,
                  policy: s3Data.policy,
                  signature: s3Data.signature
                };

                fileTransfer.upload(fileToUpload, encodeURI(s3Data.url), function(good) {
                  if ( index == (stagedPics.length - 1) )
                    qStagedPics.resolve();
                  // navigator.notification.alert("picType " +picTypeId +" uploaded");
                }, function(error) {
                  // navigator.notification.alert("Failed");
                }, fuOptions);
              });

              $scope.newRequest.pics.push(stagedPic.dbRecord);
            });

            // // 3. assign geoPoint of license plate newRequest.geoPoint
            var licPlateImg = _.findWhere($scope.newRequest.pics, {picTypeId: PICTYPE_CONST.LICPLATE});
            var statusEntry = {
              timestamp: moment( moment().toDate() ).format(),
              geoPoint: licPlateImg.geoPoint,
              statusId: statusId,
              author: {
                id: userId,
                orgTypeId: $rootScope.myOrgTypeId
              },
              notes: $scope.notes,
              signFilename: ""
            }

            $scope.newRequest.statuses.push(statusEntry);
            $scope.newRequest.geoPoint = licPlateImg.geoPoint;
            $scope.newRequest.firstSeen = moment($scope.newRequest.firstSeen).format();

            var fbReq = $firebase(Request.publishRequest($scope.newRequest).ref()).$asObject();
            fbReq.$loaded().then(function(req) {
              var status = LookupSet._getLookupSet("statuses", statusId);

              qStagedPics.promise.then(function() {
                if (status.assignToVendor == true) {
                  // add request $id to vendor's request array
                  var vendorSites = Profile._getSites(ORGTYPE_CONST.VENDOR);
                  var vendorSite = _.first(vendorSites);
                  Request.assignToSite(vendorSite, req.$id);
                }

                // add request $id to client's request array
                var clientSite = _.first( Profile._getSites($rootScope.myOrgTypeId) );
                Request.assignToSite(clientSite, req.$id);
                return;
              }).then(function() {
                // exit modal after completion
                Nav.exitView(thisView, supersonic.ui.modal.hide);
              });
            });
          },
          test: function(picTypeId) {
            var stagedPic = Request._getStagedPic(picTypeId);
            $scope.flashMsg = stagedPic.file || "NULL";
          },
          pic: function(picId) {
            var c = $scope.newRequest.pics[picId - 1].picTypeId;
            navigator.notification.alert("pic " +picId + ": " +c);
          },
          timestamp: null,
          widgets: Nav._getWidgets()
        });

        $scope.switchWidget = function(targetWidget) {
          Nav.switchWidget(targetWidget);
        }

        var closeBtn = Nav.getButton("close");
        supersonic.ui.views.current.whenVisible(function() {
          steroids.view.navigationBar.show({
            title: "New Request"
          });

          steroids.view.navigationBar.update({
            styleClass: "super-navbar",
            overrideBackButton: true,
            buttons: {
              left: [],
              right: [closeBtn.navBtn]
            }
          });
        });
      }]
    }
  })
  .directive("menu", function() {
    return {
      restrict: "EA",
      scope: {
        mySites: "="
      },
      template:
        '<div class="item"><h1>'
        +'  <button ng-show="nightMode" class="button button-large button-outline button-light" ng-click="toggleMode(false)">'
        +'    <i class="icon super-ios7-sunny-outline"></i>'
        +'  </button>'
        +'  <button ng-hide="nightMode" class="button button-large button-outline button-energized">'
        +'    <i class="icon energized super-ios7-sunny"></i>'
        +'  </button>'

        +'  <button ng-hide="nightMode" class="button button-large button-outline button-light" ng-click="toggleMode(true)">'
        +'    <i class="icon super-ios7-moon-outline"></i>'
        +'  </button>'
        +'  <button ng-show="nightMode" class="button button-large button-outline button-energized">'
        +'    <i class="icon energized super-ios7-moon"></i>'
        +'  </button></h1>'
        +'  Hello <b>{{user.firstName}} {{user.lastName}}</b>'
        +'</div>'
        +'<div class="list">'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-model-s"></i>Requests'
        +'    <span class="badge badge-balanced">25</span>'
        +'  </a>'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-wand"></i>Admin'
        +'  </a>'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-gear-b"></i>Settings'
        +'  </a>'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-ios7-star"></i>White List'
        +'    <span class="badge badge-royal">8</span>'
        +'  </a>'
        +'  <a class="item item-avatar" href="#">'
        +'    <img ng-src="{{clientImgFilepath}}{{user.filename}}" />Profile'
        +'  </a>'
        +'  <a class="item item-icon-right" href="#">'
        +'    <div ng-click="logout()">'
        +'      <i class="icon super-ios7-locked"></i>Logout'
        +'    </div>'
        +'  </a>'
        +'</div>',
      controller: ['$rootScope','$scope','Host','Nav','Profile','supersonic'
                  , function($rootScope,$scope,Host,Nav,Profile,supersonic) {
        var thisView = Nav.parseViewName(steroids.view.location);  

        angular.extend($scope, {
          clientImgFilepath: Host.buildFilepath('users', 'avatar', 'download'),
          nightMode: true,
          user: null,
          logout: function() {
            Nav.logout();
          },
          test: function() {
            console.log($scope.user);
          },
          toggleMode: function(status) {
            $scope.nightMode = status;
            document.body.className = $scope.nightMode ? "night" : "day";
          }
        });

        var closeBtn = Nav.getButton("close");
        supersonic.ui.views.current.whenVisible(function() {
          steroids.view.navigationBar.show({
            title: "App Menu"
          });

          steroids.view.navigationBar.update({
            styleClass: "super-navbar",
            overrideBackButton: true,
            buttons: {
              left: [],
              right: [closeBtn.navBtn]
            }
          });
        });

        $scope.user = Profile._getParam("userInfo");
        $scope.toggleMode($scope.nightMode);
      }]
    }
  })
  .directive("sitePicker", function() {
    return {
      restrict: "EA",
      scope: {
        doneFlag: "=indicator",
        // mySites: "=model",
        request: "=",
        sites: "="
      },
      template:
        '<div class="list">'
        +'  <span class="item item-divider">Where Is Vehicle Parked?</span>'
        +'</div>'
        +'<div ng-repeat="site in mySites" ng-click="setSite(site)"'
        +'     ng-class="{\'item item-icon-right balanced\':sites.client.$id == site.$id,'
        +'                \'item item-icon-right\':sites.client.$id != site.$id}">'
        +'  <span ng-class="item-text-wrap">'
        +'    <h2>{{site.name}}</h2>'
        +'    {{site.address.street.number}} {{site.address.street.name}} {{site.address.street.type}}'
        +'  </span>'
        +'  <i class="icon item-avatar super-ios7-checkmark-empty" ng-show="sites.client.$id == site.$id"></i>'
        +'</div>',
      controller: ['$rootScope','$scope','ORGTYPE_CONST','Profile',function (
                  $rootScope, $scope, ORGTYPE_CONST, Profile) {
        var myOrgTypeId = Profile._getParam("myOrgTypeId");
        angular.extend($scope, {
          flashMsg: "Select Site Below",
          mySites: Profile._getSites($rootScope.myOrgTypeId),
          test: function() {
            console.log("client Site: ", $scope.sites.client);
            console.log("client Site Index: ", $scope.sites.client.$id);
            console.log("vendor Site: ", $scope.sites.vendor);
            console.log("$scope vendorId: ", $scope.request.vendors.id);
          }
        });

        $scope.setSite = function(chosenSite) {
          $scope.request.clients.id = chosenSite.$id;
          $scope.sites.client = chosenSite;
          $scope.doneFlag = $scope.sites.client ? true : false;
          obtainVendor(chosenSite);
        }

        function obtainVendor(chosenClientSite) {
          var activeVendor = _.findWhere(chosenClientSite.vendors, {isActive: true});
          var vendorOrgTypeName = Profile.getOrgTypeName(ORGTYPE_CONST.VENDOR);
          Profile.retrieveSite(activeVendor.id, vendorOrgTypeName).then(function(vendorSite) {
            Profile._setSites(ORGTYPE_CONST.VENDOR, [vendorSite]);
            $scope.request.vendors.id = vendorSite.$id;
            $scope.sites.vendor = vendorSite;
          });
          //set vendor in Service && newRequest.vendors.id
        }

        var chosenSite = _.first($scope.mySites);
        $scope.setSite(chosenSite);
      }]
    }
  })