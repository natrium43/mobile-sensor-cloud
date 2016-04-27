/**
 * Created by natrium43 on 4/12/2016.
 */
var templateApp = angular.module('templateApp', []);
templateApp.controller('tempAppCtrl', ['$scope', '$http', function($scope, $http) {
    console.log("Hello World from template controller");
    var refresh = function(){
        $http.get('/templatelist').success(function(response){
            //var json_code = JSON.parse(#{respose});
            $scope.templatelist = response;
            //$scope.templatelist = json_code;
            $scope.template = "";
        })
    }
    $http.get("/templatelist").success(function (response)
    {
        console.log("I got the data for template List",response);
        $scope.templatelist = response;
        $scope.template = "";
    });//route

    $scope.saveTemplate = function() {
        console.log($scope.template);
        $http.post('/templatelist',$scope.template).success(function(response){
            console.log(response);

        });
    }

    $scope.remove = function(id){
        console.log("Removing template id",id);
        $http.delete('/templatelist/'+id).success(function(response){
            refresh();
        });
    };

}]);