  'use strict';

  function gotKey (event) {
      
      const key = event.key;
      const moveSpeed = 0.5;
      const lookSpeed = 0.5;

      // Do something based on key press
      switch(key) {
          case 'w': case 'W': // W : Forward
              cameraPosition[0] -= moveSpeed;
              break;
          case 's': case 'S': // S - backward
              cameraPosition[0] += moveSpeed;
            break;
          case 'a': case 'A': // A - left
            cameraPosition[2] += moveSpeed;
            break;
          case 'd': case 'D': // D - right
            cameraPosition[2] -= moveSpeed;
            break;
          case 'ArrowLeft': // Q - up
            cameraPosition[0] -= lookSpeed;
            break;
          case 'ArrowRight': // E - down
            cameraPosition[0] += lookSpeed;
            break;
          default:
            // console.log("Key pressed: " + key);
            break;
      }
      // create a new shape and do a redo a draw
      draw();
  }
  
