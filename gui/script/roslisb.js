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
var robotMarker = new ROS2D.ArrowShape({
  size : 0.7,
  strokeSize : 0.01,
  pulse: true,
  fillColor: createjs.Graphics.getRGB(255,0,0, 0.9),
});

// var robotMarkerArrow=new ROS2D.ArrowShape({
//   size : 0.5,
//   strokeSize : 0.01,
//   pulse: true,
//   fillColor: createjs.Graphics.getRGB(0,0,255, 0.9),
// })


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



// polygon
// Callback functions when there is mouse interaction with the polygon
// var clickedPolygon = false;
// var selectedPointIndex = null;

// var pointCallBack = function(type, event, index) {
//   if (type === 'mousedown') {
//     if (event.nativeEvent.shiftKey === true) {
//       polygon.remPoint(index);
//     }
//     else {
//       selectedPointIndex = index;
//     }
//   }
//   clickedPolygon = true;
// };

// var lineCallBack = function(type, event, index) {
//   if (type === 'mousedown') {
//     if (event.nativeEvent.ctrlKey === true) {
//       polygon.splitLine(index);
//     }
//   }
//   clickedPolygon = true;
// }

// // Create the polygon
// var polygon = new ROS2D.PolygonMarker({
//   lineColor : createjs.Graphics.getRGB(100, 100, 255,0),
//   pointCallBack : pointCallBack,
//   // lineCallBack : lineCallBack,
//   lineSize : 0.2,
//   pointSize : 0.5
// });

// // Add the polygon to the viewer
// console.log(polygon);
// gridClient.rootObject.addChild(polygon);

// // Event listeners for mouse interaction with the stage
// viewer.scene.mouseMoveOutside = false; // doesn't seem to work

// viewer.scene.addEventListener('stagemousemove', function(event) {
//   // Move point when it's dragged
//   if (selectedPointIndex !== null) {
//     var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
//     polygon.movePoint(selectedPointIndex, pos);
//   }
// });

// viewer.scene.addEventListener('stagemouseup', function(event) {
//   // Add point when not clicked on the polygon
//   if (selectedPointIndex !== null) {
//     selectedPointIndex = null;
//   }
//   else if (viewer.scene.mouseInBounds === true && clickedPolygon === false) {
//     var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
//     var pospix = {'x' : event.stageX, 'y' : Math.ceil(event.stageY)}; //Why is Y float | ceil is not for truncating!          
//     polygon.remPoint(0);
//     polygon.addPoint(pos);//SLOW just draw points
//     console.log(pospix);
//     document.getElementById("x").innerHTML = (pos.x).toFixed(2);
//     document.getElementById("y").innerHTML = (pos.y).toFixed(2);
//   }
//   clickedPolygon = false;
// });


// create initial Pose Topic and msg
const creatInitialPose=(pose_x,pose_y,orientation)=>{
  const initialPose = new ROSLIB.Topic({
    ros: ros,
    name: '/initialpose',
    messageType: 'geometry_msgs/PoseWithCovarianceStamped'
  });
  
  var posestamped_msg = new ROSLIB.Message({
    header: {
      stamp: {
        secs : 0, 
        nsecs : 100
      },
      frame_id : "map"              
    },
    pose: {
     pose:{
      position: {
        x : pose_x,
        y : pose_y,
        z : 0.0
      },
      orientation: orientation
     }
      ,
      covariance: [0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.06853892326654787]
    },
  });
   initialPose.publish(posestamped_msg)
    console.log("initialPose publish")
}
// create Goal Pose Topic and msg
const creatGoalPose=(pose_x,pose_y,orientation)=>{
  const goalPose = new ROSLIB.Topic({
    ros: ros,
    name: '/move_base_simple/goal',
    messageType: 'geometry_msgs/PoseStamped'
  });
  
  var posestamped_msg = new ROSLIB.Message({
    header: {
      stamp: {
        secs : 0, 
        nsecs : 100
      },
      frame_id : "map"              
    },
    pose: {
      position: {
        x : pose_x,
        y : pose_y,
        z : 0.0
      },
      orientation: orientation
     }
  });
    goalPose.publish(posestamped_msg)
    console.log("goalPose publish")
}


// to set MouseMoevEvent after mouseDown event , 
let mouseDown=false
let mouseDownPose={}

// why MouseState set to up  
var mouseEventHandler = function(event, mouseState,operMode) {
   console.log(`mouseState :${mouseState}`)
  if (mouseState === 'down'){
    mouseDown=true
    console.log("mouse down")
    // get position when mouse button is pressed down
    mouseDownPosition = viewer.scene.globalToRos(event.stageX, event.stageY);
    mouseDownPositionVec3 = new ROSLIB.Vector3(mouseDownPosition);
    mouseDownPose = new ROSLIB.Pose({
      position: new ROSLIB.Vector3(mouseDownPositionVec3)
    });
    console.log(mouseDownPose.position)
  }
  else if (mouseState === 'move' && mouseDown){
    console.log("mouse move")
    // // remove obsolete orientation marker
    gridClient.rootObject.removeChild(robotMarker);
  }
  else if (mouseState === 'up'&& mouseDown){
    mouseDown=false
    mouseUpPosition = viewer.scene.globalToRos(event.stageX, event.stageY);
    mouseUpPositionVec3 = new ROSLIB.Vector3(mouseUpPosition);
    const mouseUpPose = new ROSLIB.Pose({
      position: new ROSLIB.Vector3(mouseUpPositionVec3)
    });

    // upPose - DownPose
    xDelta =  mouseUpPose.position.x - mouseDownPose.position.x ;
    yDelta =  mouseUpPose.position.y - mouseDownPose.position.y;

    thetaRadians  = Math.atan2(xDelta,yDelta);

    thetaDegrees = thetaRadians * (180.0 / Math.PI);
          
    if (thetaRadians >= 0 && thetaRadians <= Math.PI) {
      thetaRadians += (3 * Math.PI / 2);
    } else {
      thetaRadians -= (Math.PI/2);
    }

    var qz =  Math.sin(-thetaRadians/2.0);
    var qw =  Math.cos(-thetaRadians/2.0);
    // degree convert to quaternion
    var orientation = new ROSLIB.Quaternion({x:0, y:0, z:qz, w:qw});

    // console.log(`xDelta : ${xDelta}, yDelta : ${yDelta} , degree : ${thetaDegrees}`)

    // set robotmaker
    if(operMode=="initial"){
      creatInitialPose(mouseDownPose.position.x,mouseDownPose.position.y,orientation)
    }else if (operMode=="goal")
      creatGoalPose(mouseDownPose.position.x,mouseDownPose.position.y,orientation)
  }};






viewer.scene.addEventListener('stagemousedown', function(event) {
  let initialPoseChecked = document.querySelector("#initialPoseswitch").checked
  let goalPoseChecked = document.querySelector("#goalPoseswitch").checked
  // set Btn control
  let operMode=initialPoseChecked?"initial":"goal"
  // button to set inital pose
  if(initialPoseChecked){
    document.querySelector("#goalPoseswitch").checked=false
    mouseEventHandler(event,'down',operMode);
  }

  if(goalPoseChecked){
    document.querySelector("#initialPoseswitch").checked=false
    mouseEventHandler(event,'down',operMode);
  }

});

viewer.scene.addEventListener('stagemousemove', function(event) {
  let initialPoseChecked = document.querySelector("#initialPoseswitch").checked
  let goalPoseChecked = document.querySelector("#goalPoseswitch").checked
  let operMode=initialPoseChecked?"initial":"goal"
  // button to set inital pose
  if(initialPoseChecked){
    document.querySelector("#goalPoseswitch").checked=false
    mouseEventHandler(event,'move',operMode);
  }

  if(goalPoseChecked){
    document.querySelector("#initialPoseswitch").checked=false
    mouseEventHandler(event,'move',operMode);
  }
  
});

viewer.scene.addEventListener('stagemouseup', function(event) {
  let initialPoseChecked = document.querySelector("#initialPoseswitch").checked
  let goalPoseChecked = document.querySelector("#goalPoseswitch").checked
  let operMode=initialPoseChecked?"initial":"goal"
  // button to set inital pose
  if(initialPoseChecked){
    document.querySelector("#goalPoseswitch").checked=false
    mouseEventHandler(event,'up',operMode);
  }

  if(goalPoseChecked){
    document.querySelector("#initialPoseswitch").checked=false
    mouseEventHandler(event,'up',operMode);
  }
  
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
      // querternion to theta
      // let quaZ = pose.pose.pose.orientation.z;
      // let degreeZ = 0;
      // if( quaZ >= 0 ) {
      //     degreeZ = quaZ / 1 * 180
      // } else {
      //     degreeZ = (-quaZ) / 1 * 180 + 180
      // };
      let orientationQuerter=pose.pose.pose.orientation
      var q0 = orientationQuerter.w;
      var q1 = orientationQuerter.x;
      var q2 = orientationQuerter.y;
      var q3 = orientationQuerter.z;
      degree=-Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI
      robotMarker.rotation = degree;
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



