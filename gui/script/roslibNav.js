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






function mapLoad() {
  // conf
  let OperRatingMode="nav"


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


// create initial Pose Topic and msg
const creatInitialPose=(pose_x,pose_y)=>{
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
      orientation: {
        x : 0.0,
        y : 0.0,
        z : -0.035,
        w : 0.9993
      }
     }
      ,
      covariance: [0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.06853892326654787]
    },
  });
   initialPose.publish(posestamped_msg)
    console.log("initialPose publish")
}
// create Goal Pose Topic and msg
const creatGoalPose=(pose_x,pose_y)=>{
  const initialPose = new ROSLIB.Topic({
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
      orientation: {
        x : 0.0,
        y : 0.0,
        z : -0.035,
        w : 0.9993
      }
     }
  });
   initialPose.publish(posestamped_msg)
    console.log("initialPose publish")
}

var actionClient = new ROSLIB.ActionClient({
    ros : ros,
    actionName : 'move_base_msgs/MoveBaseAction',
    serverName : 'move_base'
  });

function sendGoal(pose) {
    // create a goal
    var goal = new ROSLIB.Goal({
      actionClient : actionClient,
      goalMessage : {
        target_pose : {
          header : {
            frame_id : '/map'
          },
          pose : pose
        }
      }
    });
    goal.send();

    // create a marker for the goal
    var goalMarker = new ROS2D.NavigationArrow({
      size : 10,
      strokeSize : 1,
      fillColor : createjs.Graphics.getRGB(255, 64, 128, 0.66),
      pulse : true
    });
    goalMarker.x = pose.position.x;
    goalMarker.y = -pose.position.y;
    goalMarker.rotation = stage.rosQuaternionToGlobalTheta(pose.orientation);
    goalMarker.scaleX = 1.0 / stage.scaleX;
    goalMarker.scaleY = 1.0 / stage.scaleY;
    gridClient.rootObject.addChild(goalMarker);

    goal.on('result', function() {
        gridClient.rootObject.removeChild(goalMarker);
    });
  }

  // get a handle to the stage
  var stage;
  if (gridClient.rootObject instanceof createjs.Stage) {
    stage = gridClient.rootObject;
  } else {
    stage = gridClient.rootObject.getStage();
  }




var mouseEventHandler = function(event, mouseState) {

    if (mouseState === 'down'){
      console.log("mouse down")
      // get position when mouse button is pressed down
      position = viewer.scene.globalToRos(event.stageX, event.stageY);
      positionVec3 = new ROSLIB.Vector3(position);
      mouseDown = true;
    }
    else if (mouseState === 'move'){
       console.log("mouse move")
      // remove obsolete orientation marker
      gridClient.rootObject.removeChild(robotMarker);
      
      if ( mouseDown === true) {
        // if mouse button is held down:
        // - get current mouse position
        // - calulate direction between stored <position> and current position
        // - place orientation marker
        var currentPos = viewer.scene.globalToRos(event.stageX, event.stageY);
        var currentPosVec3 = new ROSLIB.Vector3(currentPos);


        xDelta =  currentPosVec3.x - positionVec3.x;
        yDelta =  currentPosVec3.y - positionVec3.y;
        
        thetaRadians  = Math.atan2(xDelta,yDelta);

        thetaDegrees = thetaRadians * (180.0 / Math.PI);
        
        if (thetaDegrees >= 0 && thetaDegrees <= 180) {
          thetaDegrees += 270;
        } else {
          thetaDegrees -= 90;
        }

        robotMarker.x =  positionVec3.x;
        robotMarker.y = -positionVec3.y;
        robotMarker.rotation = thetaDegrees;
        robotMarker.scaleX = 1.0 / viewer.scene.scaleX;
        robotMarker.scaleY = 1.0 / viewer.scene.scaleY;
        
        gridClient.rootObject.addChild(robotMarker);
      }
    } else if (mouseDown) { // mouseState === 'up'
      // if mouse button is released
      // - get current mouse position (goalPos)
      // - calulate direction between stored <position> and goal position
      // - set pose with orientation
      // - send goal
      console.log("mouse down true")
      mouseDown = false;

      var goalPos =viewer.scene.globalToRos(event.stageX, event.stageY);

      var goalPosVec3 = new ROSLIB.Vector3(goalPos);
      
      xDelta =  goalPosVec3.x - positionVec3.x;
      yDelta =  goalPosVec3.y - positionVec3.y;
      
      thetaRadians  = Math.atan2(xDelta,yDelta);
      
      if (thetaRadians >= 0 && thetaRadians <= Math.PI) {
        thetaRadians += (3 * Math.PI / 2);
      } else {
        thetaRadians -= (Math.PI/2);
      }
      
      var qz =  Math.sin(-thetaRadians/2.0);
      var qw =  Math.cos(-thetaRadians/2.0);
      
      var orientation = new ROSLIB.Quaternion({x:0, y:0, z:qz, w:qw});
      
      var pose = new ROSLIB.Pose({
        position :    positionVec3,
        orientation : orientation
      });
 
      sendGoal(pose);
    }
  };



//map mouse click event to set pose 
viewer.scene.addEventListener('stagemousedown', function(event) {
    mouseEventHandler(event,'down');
});

viewer.scene.addEventListener('stagemousedown', function(event) {
    mouseEventHandler(event,'move');
});

viewer.scene.addEventListener('stagemousedown', function(event) {
    mouseEventHandler(event,'up');
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



