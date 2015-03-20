angular.module('auth', ['common'])
  .run(["$rootScope", function($rootScope) {

  }])
  .controller('AuthCtrl', ['$firebase','$q','$rootScope','$sanitize','$scope','FB'
                          ,'Host','Nav','Profile','supersonic','UserData'
                          ,function($firebase,$q,$rootScope,$sanitize,$scope,FB
                          ,Host,Nav,Profile,supersonic,UserData,$ionicSlideBoxDelegate) {
    angular.extend($scope, {
      creds: {
        email: "",
        password: "",
        rememberMe: false
      },
      isLoggedIn: false,
      imgFilepathUser: Host.buildFilepath('users','avatar'),
      login: function(creds, rememberMe) {
        /******************** L O G I N *************************
        *********************************************************
        ********************************************************/
        var fBAuthRef = Profile._getParam("fBAuthRef");
        var loginParams = {
          email: $sanitize(creds.email),
          password: $sanitize(creds.password),
          rememberMe: rememberMe
        };

        fBAuthRef.$authWithPassword(loginParams).then(function(authResults) {
          Nav.enterView("summary", {
            animation: supersonic.ui.animate("slideFromTop", { duration: 0.3 }),
            method: supersonic.ui.initialView.dismiss,
            destType: "root"
          });
        }, function(error) {
          navigator.notification.alert("too bad!");
          // need to handle login error!!!
        });
        /********************************************************
        *********************************************************
        ********************************************************/
      },
      rememberMe: true,
      users: null,
      fbUsers: null
    });

    UserData.getUsers().then(function(users) {
      $scope.users = users;
    });
  }]);