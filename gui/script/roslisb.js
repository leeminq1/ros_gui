// Ros WEB SOCKET SERVER CONF

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
    //url : 'ws://192.168.204.98:9090'
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


  // pathShape
var listenerforPath = new ROSLIB.Topic ({
  ros : ros,
  name : '/move_base/NavfnROS/plan',
  messageType : 'nav_msgs/Path'
});

// TraceShape
var moveBaseFB = new ROSLIB.Topic ({
  ros : ros,
  name : '/move_base/feedback',
  messageType : 'move_base_msgs/MoveBaseActionFeedback'
  });

  // Publishing Topic
//  const cmdVel = new ROSLIB.Topic({
//     ros : ros,
//     name : "/turtle1/cmd_vel",
//     messageType : 'geometry_msgs/Twist'
//   });


// const TxtSend = new ROSLIB.Topic({
//     ros : ros,
//     name : '/txtsend',
//     messageType : 'std_msgs/String'
// });



// const move = function (linear, angular) {
//     // Twist msg
//     var twist = new ROSLIB.Message({
//       linear: {
//         x: linear,
//         y: 0,
//         z: 0
//       },
//       angular: {
//         x: 0,
//         y: 0,
//         z: angular
//       }
//     });

//     //string msg
//     let txt=new ROSLIB.Message({
//         data:`Lindear Velocitiy : ${linear.toFixed(2)} , Angular Velocity : ${angular.toFixed(2)}`
//     })


//     cmdVel.publish(twist);
//     TxtSend.publish(txt);
    
//   }


// Subscriber Topic 
// TxtSend.subscribe(function(message) {
//     document.getElementById("msg").innerHTML = `${message.data}`;
//     // listener.unsubscribe();
// });





function mapLoad() {
  // conf
  let OperRatingMode="nav"


//  const CreatePathPlanTopic=()=>{
//     let listenerforPath = new ROSLIB.Topic ({
//       ros :ros,
//       name : '/move_base/NavfnROS/plan',
//       messageType : 'nav_msgs/Path'
//       });
//  }




  const CreatePoseTopic=(OperRatingMode)=>{

    console.log(`Create posetopic , mode :${OperRatingMode}`)

    if(OperRatingMode == "slam"){
      console.log("poseTopic slam")
        // Make robot pose subscriber
    const SlamPoseTopic = new ROSLIB.Topic({
      ros : ros,
      name : '/tf',
      messageType:'tf2_msgs/TFMessage'
      // messageType : 'turtlesim/Pose'
      // messageType : 'geometry_msgs/Pose'
    })
    return SlamPoseTopic

    }else if(OperRatingMode=="nav"){
      console.log("poseTopic nav")
      const NavPoseTopic = new ROSLIB.Topic({
        ros: ros,
        name: '/amcl_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
      });
      return NavPoseTopic
    }

  }

  // poseTopic Publisher
  let PoseTopic=CreatePoseTopic(OperRatingMode)

  // Connect to ROS.
  // Create the main viewer.
  var viewer = new ROS2D.Viewer({
    divID : 'map',
    width : 700,
    height : 700,
  });

  // Setup the map client.
  var gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : viewer.scene,
    image: 'turtlebot.png',
    continuous: true
  });

  // Setup the robot pose
//   var robotMarker = new NAVIGATION2D.PoseAndTrace({
//     size : 0.25,
//     strokeSize : 0.05,
//     pulse: true,
//     fillColor: createjs.Graphics.getRGB(255,0,0, 0.9)
// });

// robot odometry
var robotMarker = new ROS2D.NavigationArrow({
  size : 0.25,
  strokeSize : 0.05,
  pulse: true,
  fillColor: createjs.Graphics.getRGB(255,0,0, 0.9)
});

// pathShape 
var pathShape = new ROS2D.PathShape({
  strokeSize : 0.03,
  strokeColor : createjs.Graphics.getRGB(0, 255, 0,1),
  });

  gridClient.rootObject.addChild(pathShape);

  listenerforPath.subscribe((message)=> {
    if(message){
      pathShape.setPath(message);
    }
    // listenerforPath.unsubscribe();
  });
  
  // var gotoClient = new ROSLIB.ActionClient({
  //   ros : ros,
  //   serverName : '/goto_position',
  //   actionName : '/GotoPositionAction'
  // });

  //Draw actual trace
  var traceShape = new ROS2D.TraceShape({
      strokeSize : 0.1,
      strokeColor : createjs.Graphics.getRGB(255, 0, 0,0.5),
      maxPoses  : 250
    });
  
  gridClient.rootObject.addChild(traceShape);
    //update on new message
  moveBaseFB.subscribe(function(message) {
      traceShape.addPose(message.feedback.base_position.pose);
      //arrowShape.setPose(message.feedback.base_position.pose);
      //listener.unsubscribe();
    });


// Callback functions when there is mouse interaction with the polygon
var clickedPolygon = false;
var selectedPointIndex = null;

var pointCallBack = function(type, event, index) {
  if (type === 'mousedown') {
    if (event.nativeEvent.shiftKey === true) {
      polygon.remPoint(index);
    }
    else {
      selectedPointIndex = index;
    }
  }
  clickedPolygon = true;
};

var lineCallBack = function(type, event, index) {
  if (type === 'mousedown') {
    if (event.nativeEvent.ctrlKey === true) {
      polygon.splitLine(index);
    }
  }
  clickedPolygon = true;
}

// Create the polygon
var polygon = new ROS2D.PolygonMarker({
  lineColor : createjs.Graphics.getRGB(100, 100, 255,0),
  pointCallBack : pointCallBack,
  lineCallBack : lineCallBack,
  lineSize : 0.2,
  pointSize : 0.5
});

// Add the polygon to the viewer
console.log(polygon);
gridClient.rootObject.addChild(polygon);

// Event listeners for mouse interaction with the stage
viewer.scene.mouseMoveOutside = false; // doesn't seem to work

viewer.scene.addEventListener('stagemousemove', function(event) {
  // Move point when it's dragged
  if (selectedPointIndex !== null) {
    var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
    polygon.movePoint(selectedPointIndex, pos);
  }
});

viewer.scene.addEventListener('stagemouseup', function(event) {
  // Add point when not clicked on the polygon
  if (selectedPointIndex !== null) {
    selectedPointIndex = null;
  }
  else if (viewer.scene.mouseInBounds === true && clickedPolygon === false) {
    var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
    var pospix = {'x' : event.stageX, 'y' : Math.ceil(event.stageY)}; //Why is Y float | ceil is not for truncating!          
    polygon.remPoint(0);
    polygon.addPoint(pos);//SLOW just draw points
    console.log(pospix);
    document.getElementById("x").innerHTML = (pos.x).toFixed(2);
    document.getElementById("y").innerHTML = (pos.y).toFixed(2);
  }
  clickedPolygon = false;
});
















  
const createFunc = function (handlerToCall, discriminator, robotMarker,OperRatingMode) {


  return discriminator.subscribe(function(pose){

      if (OperRatingMode=="slam"){
      // slam
      // CrtoGrapher slam case(tf2_msgs/TFMessage)
      console.log("slam work")
      let odomPose = pose.transforms[0].transform.translation
      let baseLinkPose=pose.transforms[1].transform.translation

      //  When using Nav,  gemometry_msgs/Pose .orientation. {x,y,z,w} (Quarternion)  
      //  When using SLAM  tf2_msgs/TFMessage .transform . rotation  {x,y,z,w} (quarternion)
      let quaZ=pose.transforms[1].transform.rotation.z

      // pose using odom
      robotMarker.x = baseLinkPose.x;
      robotMarker.y = -baseLinkPose.y;

      let degreeZ = 0;
      if( quaZ >= 0 ) {
          degreeZ = quaZ / 1 * 180
      } else {
          degreeZ = (-quaZ) / 1 * 180 + 180
      };
      // degree
      robotMarker.rotation = degreeZ;

      }else if(OperRatingMode=="nav"){
      // navigation
      console.log("nav work")
      robotMarker.x = pose.pose.pose.position.x;
      robotMarker.y = -pose.pose.pose.position.y;
      let quaZ = pose.pose.pose.orientation.z;
      let degreeZ = 0;
      if( quaZ >= 0 ) {
          degreeZ = quaZ / 1 * 180
      } else {
          degreeZ = (-quaZ) / 1 * 180 + 180
      };
      
      robotMarker.rotation = -degreeZ;
      }

      // turtlesim
      // robotMarker.x = pose.x;
      // robotMarker.y = -pose.y;

        // rootObject를 통해서 robotMaker에 Marker 넣어줌
        gridClient.rootObject.addChild(robotMarker);

    })
}

// navigation pose / tf 
  createFunc('subscribe',PoseTopic, robotMarker,OperRatingMode);
  

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



