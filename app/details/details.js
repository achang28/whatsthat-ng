angular.module('details', ['common'])
  .run(function($rootScope, Nav) {
    var buttons = ["back", "create", "profile"];
    Nav.initPreloadView("modal");
    Nav.setButtons(buttons);

    buttons[0] = Nav.initButtons('back', "back.png", "left", 0, Nav.setupButton);
    buttons[1] = Nav.initButtons('create', "add.png", "right", 0, Nav.setupButton);
    buttons[1].navBtn.onTap = function() {
      Nav.enterView("modal", Nav.modalOnTapOptions("create"));
    }

    buttons[2] = Nav.initButtons('profile', "user.png", "right", 1, Nav.setupButton);
    buttons[2].navBtn.onTap = function() {
      Nav.enterView("modal", Nav.modalOnTapOptions("profile"));
    }

    steroids.view.navigationBar.show({
      title: "Details"
    });

    supersonic.device.ready.then( function() {
      console.log("ready for details");
      supersonic.data.channel("DOMReady").publish();
      Nav.startView("modal");
    });
  })
  .controller("DetailsCtrl", ["$q","$rootScope","$scope","FB","Host","Item","Nav"
                            ,"Position","supersonic",function($q,$rootScope,$scope
                            ,FB,Host,Item,Nav,Position,supersonic) {
    var buttons = Nav.getButtons();
    var backBtn = Nav.getButton("back");
    var thisView = Nav.parseViewName(steroids.view.location);
    var _userVoteIndex;

    angular.extend($scope, {
      flashMsg: "",
      imgFilepathItem: Host.buildFilepath('items','base'),
      item: null,
      userInfo: null,
      userVote: null,
      vote: function(direction) {
        // previous vote exists
        if ($scope.userVote) {
          if ($scope.userVote.direction == direction)
            return;
          else {
            addVoteToItem(direction);
            subtractVoteFromItem(direction);
            updateUserVoteList(_userVoteIndex, direction);
          }
        }

        // no previous vote -- this is a new vote
        else {
          addVoteToItem(direction);
          addVoteToUserList(direction);
        }

        $scope.item.$save();
        $scope.userInfo.$save();
        $scope.userVote = _.findWhere($scope.userInfo.votes, {itemId: $scope.item.$id});
      }
    });

    $rootScope.qUserInfo.promise.then(function(userInfo) {
      $scope.userInfo = userInfo;
    });

    function addVoteToItem(direction) {
      $scope.item.votes[direction]++;
    }

    function subtractVoteFromItem(direction) {
      $scope.item.votes[direction == "up" ? "down" : "up"]--;
    }

    function addVoteToUserList(direction) {
      var vote = {
        direction: direction,
        itemId: $scope.item.$id
      };

      if ( !angular.isDefined($scope.userInfo.votes) )
        angular.extend($scope.userInfo, {
          votes: []
        });

      $scope.userInfo.votes.push(vote);
      _userVoteIndex = getUserVoteIndex($scope.item.$id);
    }

    function updateUserVoteList(voteIndex, newDirection) {      
      $scope.userInfo.votes[voteIndex].direction = newDirection;
    }

    function getUserVoteIndex(itemId) {
      return _.findIndex($scope.userInfo.votes, function(vote) {
        return vote.itemId == itemId;
      });
    }

    backBtn.navBtn.onTap = function() {  
      Nav.exitView(thisView, supersonic.ui.layers.pop);
      $scope.item = null;
    }

    /******************* USE FOR ANDROID ONLY ********************/
    //  Nav.exitView(thisView, supersonic.ui.layers.pop);
    //  $scope.item = null;
    // });

    supersonic.data.channel("detailsData").subscribe( function(message) {
      Position._setGeoPoint($rootScope.currentGeoPoint = message.content.geoPoint);
      $scope.item = Item._getItem();      
      $scope.$digest();
      var qItem = $q.defer();

      var readyParams = {
        sender: Nav.parseViewName(steroids.view.location),
        content: {}
      };

      supersonic.data.channel("detailsReady").publish(readyParams);
      if (!$scope.item || message.content.itemId != $scope.item.$id) {
        var itemRef = FB.getRef().child("items").child(message.content.itemId);

        Item.retrieveItem(itemRef).then(function(item) {
          qItem.resolve(item);
          Item._setItem($scope.item = item);
        });
      } else
        qItem.resolve($scope.item);

      qItem.promise.then(function(item) {
        $scope.userVote = _.findWhere($scope.userInfo.votes, {itemId: item.$id});
        _userVoteIndex = getUserVoteIndex(item.$id);
      });

      steroids.view.navigationBar.update({
        styleClass: "super-navbar",
        overrideBackButton: true,
        buttons: {
          left: _.pluck(_.where(buttons, {side: "left"}), "navBtn"),
          right: _.pluck(_.where(buttons, {side: "right"}), "navBtn")
        }
      });
    });
  }])