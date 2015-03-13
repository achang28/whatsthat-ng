angular.module('modal', ['common'])
  .run(['$q','$rootScope','Nav','supersonic', function($q,$rootScope,Nav,supersonic) {
    var thisView = Nav.parseViewName(steroids.view.location); 

    supersonic.device.ready.then( function() {
      console.log("ready for modal");
      supersonic.data.channel("DOMReady").publish();
    });
  }])
  .controller('ModalCtrl', ['$q','$rootScope','$scope','Nav','Position','Profile','supersonic'
                        , function($q, $rootScope,$scope,Nav,Position,Profile,supersonic) {
    var thisView = Nav.parseViewName(steroids.view.location);
    Nav.initSubViews(["create", "profile"]);
    angular.extend($scope, {
      subViews: Nav._getSubViews(),
      userInfo: null
    });

    var buttons = new Array("close");
    Nav.setButtons(buttons);

    buttons[0] = Nav.initButtons('close', "close.png", "right", 1, Nav.setupButton);
    buttons[0].navBtn.onTap = function() {
      Nav.exitView(thisView, supersonic.ui.modal.hide);
    }

    $rootScope.qUserInfo.promise.then(function(userInfo) {
      $scope.userInfo = userInfo;
    });

    var unsubscribeLocation = supersonic.data.channel("locationData").subscribe(function(message) {
      Position._setGeoPoint($rootScope.currentGeoPoint = message.content.geoPoint);
      $rootScope.$digest();
    });
    
    supersonic.data.channel(thisView +"Data").subscribe( function(message) {
      Position._setGeoPoint($rootScope.currentGeoPoint = message.content.geoPoint);
      var targetSubView = message.content.targetSubView
      var readyParams = {
        sender: Nav.parseViewName(steroids.view.location),
        content: {}
      };

      if ($scope.subViews[targetSubView] != true)
        Nav.switchSubView(targetSubView);

      supersonic.data.channel(thisView +"Ready").publish(readyParams);
      $scope.$digest();
    });
  }])
  .directive('create', function() {
    return {
      restrict: "EA",
      template:
        // <!-- P I C -->
        '<div pic-processor model="pic" title="Take a picture"></div>'

        // <!-- T I T L E,  D E S C, and C O M M E N T S -->
        +'<label class="list list-inset item item-input">'
        +'  <input type="text" ng-model="newItem.name" placeholder="Title" />'
        +'</label>'
        +'<label class="item list-inset item item-input">'
        +'  <textarea class="item-note" rows="3" ng-model="newItem.desc" placeholder="description..."></textarea>'
        +'</label>'

        // S U B M I T
        +'<div class="list list-inset" ng-show="pic.file">'
        +'  <button class="button button-block button button-calm" ng-click="submitRequest(0)"><b>Show it off, baby!</b></button>'
        +'</div>',
      controller: ['$firebase','$http','$q','$rootScope','$scope','Host','Nav'
                  ,'Position','Profile','Item','supersonic','Watcher', function(
                  $firebase,$http,$q,$rootScope,$scope,Host,Nav,Position,Profile
                  ,Item,supersonic,Watcher) {
        // setup Nav stuff
        var thisView = Nav.parseViewName(steroids.view.location);
        var qS3Policy = Host.retrieveS3Policy(); // a promise

        angular.extend($scope, {
          flashMsg: null,
          newItem: {
            iid: "",
            created: moment().toDate(),
            authorId: Profile._getParam("userInfo").$id,
            geoPoint: null,
            name: "",
            desc: "",
            filename: "",
            votes: {
              up: 0,
              down: 0
            }
          },
          pic: Item.refreshPicParams(),
          submitRequest: function(statusId) {
            var userInfo = Profile._getParam("userInfo")
            $scope.newItem.created = $scope.pic.dbRecord.created;
            $scope.newItem.authorId = userInfo.$id;
            $scope.newItem.geoPoint = $scope.pic.dbRecord.geoPoint;
            
            // 1. preparations prior to file upload
            var fileTransfer = new FileTransfer();
            var timestamp = moment().format("X");
            var fileToUpload = $scope.pic.file.sourceFilename;
            var fileType = $scope.pic.file.fileType;
            var fuOptions = new FileUploadOptions();

            $scope.newItem.filename = Item.generateImgId(timestamp,userInfo.$id,fileType);
            $scope.flashMsg = $scope.newItem;
            
            qS3Policy.then(function(s3Data) {
              fuOptions.mimeType = "image/" +fileType;
              fuOptions.params = {
                key: "items/base/" +$scope.newItem.filename,
                acl: 'public-read',
                'Content-Type': "image/" +fileType,
                AWSAccessKeyId: s3Data.key,
                policy: s3Data.policy,
                signature: s3Data.signature
              };

              fileTransfer.upload(fileToUpload, encodeURI(s3Data.url), function(good) {
                var fbItem = $firebase(Item.publishItem($scope.newItem).ref()).$asObject();
                fbItem.$loaded().then(function(item) {
                  item.iid = item.$id;
                  item.$save();
                  
                  // add itemId to user's items array
                  if (!angular.isDefined(userInfo.items))
                    angular.extend(userInfo, {
                      items: []
                    });
                  
                  userInfo.items.push(item.$id);
                  userInfo.$save();
                  Nav.exitView(thisView, supersonic.ui.modal.hide);
                });
              }, function(error) {
                navigator.notification.alert("Failed");
              }, fuOptions);
            });
          }
        });

        var closeBtn = Nav.getButton("close");
        supersonic.ui.views.current.whenVisible(function() {
          steroids.view.navigationBar.show({
            title: "What's That?"
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