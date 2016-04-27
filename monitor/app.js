var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/sensor_db') ;
var Schema = mongoose.Schema;

var sensorSchema = new Schema({
  value:{ type:Number, default:0},
  format:{type:String, default:"default"},
  id:{type:Number,required:true,unique:true},
  description:{type:String},
  type:{type:String},
  groupId:{type:Number},
  users:{type:Array,default:[]},
  admin:{type:String,default:'Undefined'},
  status:{type:String,default:'Undefined'},
  owner:{type:String,default:'Undefined'},
  templateId:{type:Number}

});
var Sensor = mongoose.model('Sensor',sensorSchema);

io.on('connection', function(socket){
  console.log('connection received from Provisioning');
  // To get messages from Provisioning server
  socket.on('eventToClient',function(data) {
    var id = data.id
    Sensor.findOne({id: id}, function (err, doc) {
      if (!err)
        socket.emit('reply',{result:doc, resKey: data.resKey});
      else 
        socket.emit('reply',{'error':'500'})

    })
  });
});

server.listen(4000, function(){
  console.log('socket.io server listening on *:4000');
});

