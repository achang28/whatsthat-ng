angular.module('auth', ['common'])
  .run(["$rootScope", function($rootScope) {

  }])
  .controller('AuthCtrl', ['$firebase','$q','$rootScope','$sanitize','$scope','FB'
                          ,'Host','Nav','Profile','supersonic','UserData'
                          ,function($firebase,$q,$rootScope,$sanitize,$scope,FB
                          ,Host,Nav,Profile,supersonic,UserData) {
    angular.extend($scope, {
      credentials: '',
      isLoggedIn: false,
      imgFilepathUser: Host.buildFilepath('users','avatar'),
      login: function(creds, rememberMe) {
        var qLogin = $q.defer();
        var fBAuthRef = Profile._getParam("fBAuthRef");

        fBAuthRef.$authWithPassword({
          email: $sanitize(creds.email),
          password: $sanitize(creds.password),
          rememberMe: rememberMe
        }).then(function(authResults) {
          Nav.enterView("summary", {
            animation: supersonic.ui.animate("slideFromTop", { duration: 0.3 }),
            method: supersonic.ui.initialView.dismiss,
            destType: "root"
          });
        }, function(error) {
          qLogin.reject(error);
          // need to handle login error!!!
        });
      },
      rememberMe: false,
      users: null,
      fbUsers: null
    });

    UserData.getUsers().then(function(users) {
      $scope.users = users;
    });
  }]);