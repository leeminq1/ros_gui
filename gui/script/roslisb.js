var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
    // url : 'ws://192.168.202.26:9090'
  });

  ros.on('connection', function() {
    document.getElementById("status").innerHTML = "Connected";
  });

  ros.on('error', function(error) {
    document.getElementById("status").innerHTML = "Error";
  });

  ros.on('close', function() {
    document.getElementById("status").innerHTML = "Closed";
  });


  // Publishing Topic
 const cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : "/turtle1/cmd_vel",
    messageType : 'geometry_msgs/Twist'
  });


const TxtSend = new ROSLIB.Topic({
    ros : ros,
    name : '/txtsend',
    messageType : 'std_msgs/String'
});





const move = function (linear, angular) {
    // Twist msg
    var twist = new ROSLIB.Message({
      linear: {
        x: linear,
        y: 0,
        z: 0
      },
      angular: {
        x: 0,
        y: 0,
        z: angular
      }
    });

    //string msg
    let txt=new ROSLIB.Message({
        data:`Lindear Velocitiy : ${linear.toFixed(2)} , Angular Velocity : ${angular.toFixed(2)}`
    })


    cmdVel.publish(twist);
    TxtSend.publish(txt);
    
  }


// Subscriber Topic 
TxtSend.subscribe(function(message) {
    document.getElementById("msg").innerHTML = `${message.data}`;
    // listener.unsubscribe();
});


 




function mapLoad() {
  // Connect to ROS.
  // Create the main viewer.
  var viewer = new ROS2D.Viewer({
    divID : 'map',
    width : 600,
    height : 500
  });

  // Setup the map client.
  var gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : viewer.scene,
    image: 'turtlebot.png',
    continuous: true
  });

  // Setup the map client.
  var robotMarker = new ROS2D.NavigationArrow({
    size : 0.25,
    strokeSize : 0.05,
    pulse: true,
    fillColor: createjs.Graphics.getRGB(0,0,0, 0.9)
});

        // Make robot pose subscriber
  const poseTopic = new ROSLIB.Topic({
    ros : ros,
    name : '/turtle1/pose',
    messageType : 'turtlesim/Pose'
    // messageType : 'geometry_msgs/Pose'
  });

  
const createFunc = function (handlerToCall, discriminator, robotMarker) {
  return discriminator.subscribe(function(pose){


      //  일반적인 경우 gemometry_msgs/Pose 내에 가져올때
        // robotMarker.x = pose.pose.pose.position.x;
        // robotMarker.y = -pose.pose.pose.position.y;
        // var quaZ = pose.pose.pose.orientation.z;

      // turtlesim
      robotMarker.x = pose.x;
      robotMarker.y = -pose.y;
      const quaZ=pose.theta

        // var degreeZ = 0;
        // if( quaZ >= 0 ) {
        //     degreeZ = quaZ / 1 * 180
        // } else {
        //     degreeZ = (-quaZ) / 1 * 180 + 180
        // };
        robotMarker.rotation = pose.theta;

        // rootObject를 통해서 robotMaker에 값을 넣어줌
        gridClient.rootObject.addChild(robotMarker);
    })
}

// navigation pose / tf 
  createFunc('subscribe', poseTopic, robotMarker);
  

  // Scale the canvas to fit to the map
  gridClient.on('change', function(){
    viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
    viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
  });
  
}

// window.onload는 최종에 있는거 한번만 실행됨
window.addEventListener('onload', 
  console.log("mapload"),
  mapLoad()
)



