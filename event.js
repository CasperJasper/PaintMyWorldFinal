  'use strict';

  function gotKey (event) {


      const key = event.key;

      const moveSpeed = 0.5;
      const lookSpeed = 0.5;


      // Do something based on key press
      if (key === 'w' || key === 'W') {
          cameraPosition[2] -= moveSpeed;
          cameraTarget[2]   -= moveSpeed;
      } else if (key === 's' || key === 'S') {
          cameraPosition[2] += moveSpeed;
          cameraTarget[2]   += moveSpeed;
      } else if (key === 'a' || key === 'A') {
          cameraPosition[0] -= moveSpeed;
          cameraTarget[0]   -= moveSpeed;
      } else if (key === 'd' || key === 'D') {
          cameraPosition[0] += moveSpeed;
          cameraTarget[0]   += moveSpeed;
      }

      // --- Arrow keys: orbit camera around target
      if (key.startsWith("Arrow")) event.preventDefault();

      if (key === "ArrowLeft")  camYaw += lookSpeed;
      if (key === "ArrowRight") camYaw -= lookSpeed;
      if (key === "ArrowUp")    camPitch = Math.min(1.2, camPitch + lookSpeed);
      if (key === "ArrowDown")  camPitch = Math.max(-0.2, camPitch - lookSpeed);

      const cx = cameraTarget[0] + Math.sin(camYaw) * Math.cos(camPitch) * camRadius;
      const cy = cameraTarget[1] + Math.sin(camPitch) * camRadius;
      const cz = cameraTarget[2] + Math.cos(camYaw) * Math.cos(camPitch) * camRadius;

      cameraPosition[0] = cx;
      cameraPosition[1] = cy;
      cameraPosition[2] = cz;

      if (key === 'p' || key === 'P') {
          console.log("cameraPosition =", JSON.stringify(cameraPosition));
          console.log("cameraTarget   =", JSON.stringify(cameraTarget));
      }
      // create a new shape and do a redo a draw
      draw();
  }
  
