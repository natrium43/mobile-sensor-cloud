/**
 * Created by natrium43 on 4/10/2016.
 */
var myApp = angular.module('myApp', []);
myApp.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {
    console.log("Hello World from controller");
var refresh = function(){
    $http.get('/sensorlist').success(function(response){
        $scope.sensorlist = response;
        $scope.sensor = "";
    })
}
$http.get("/sensorlist").success(function (response)
{
    console.log("I got the data for sensorList",response);
    $scope.sensorlist = response;
    $scope.sensor = "";
});//route

$scope.registerSensor = function() {
    console.log($scope.sensor);
    $http.post('/sensorlist',$scope.sensor).success(function(response){
        console.log(response);

    });
}

$scope.remove = function(id){
    console.log("Removing button id",id);
    $http.delete('/sensorlist/'+id).success(function(response){
        refresh();
    });
};

}]);