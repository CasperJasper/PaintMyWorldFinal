  'use strict';


  var mat4 = glMatrix.mat4;
  var mat3 = glMatrix.mat3;

  // Global variables that are set and used
  // across the application
  let gl, canvas;


  // GLSL programs
  let phongProgram, skyProgram, cloudProgram;

  
  // VAOs for the objects
  let platformVAO, groundVAO, skyVAO;
  let kingBaseVAO, kingBodyVAO, kingTopVAO, kingCrossVAO;


  // textures
  let chessboardTexture, groundTexture, skyTex;

  //
  let skyPosLoc, skyUvLoc;

  // rotation


  // King Chess Shapes
  let platformShape, groundShape;
  let kingBaseShape, kingBodyShape, kingTopShape, kingCrossShape;

// Camera control variables
let cameraPosition = [7.6, 7.4, 8.6];
let cameraTarget = [0.0, 1.0, 0.0];
let cameraUp = [0.0, 1.0, 0.0];


// Lighting
let lightPosition = [6.0, 9.0, 4.0];
let lightColor = [1.0, 1.0, 1.0];

//
// create shapes and VAOs for objects.
// Note that you will need to bindVAO separately for each object / program based
// upon the vertex attributes found in each program
//
function createShapes() {
    kingBaseShape = new Cylinder(20,20);
    kingBodyShape = new Cylinder(20,20);
    kingTopShape = new Sphere(20,20);
    kingCrossShape = new Cube(20);

    // Platform for chess board
    platformShape = new Cube(20);

    // initialize ground for scene
    groundShape = new Cube(20);


}

function initPrograms() {
    // Initialize all shader programs
    phongProgram = initProgram("phong-V", "phong-F");
    skyProgram = initProgram("sky-V", "sky-F");
    cloudProgram = initProgram("cloud-V", "cloud-F");


    // Set up attribute locations for Phong program
    phongProgram.aVertexPosition = gl.getAttribLocation(phongProgram, "aVertexPosition");
    phongProgram.aVertexNormal = gl.getAttribLocation(phongProgram, "aVertexNormal");
    phongProgram.aTextureCoord = gl.getAttribLocation(phongProgram, "aTextureCoord");

    // Set up uniform locations for Phong program
    phongProgram.uModelViewMatrix = gl.getUniformLocation(phongProgram, "uModelViewMatrix");
    phongProgram.uProjectionMatrix = gl.getUniformLocation(phongProgram, "uProjectionMatrix");
    phongProgram.uNormalMatrix = gl.getUniformLocation(phongProgram, "uNormalMatrix");

    phongProgram.uLightPosition = gl.getUniformLocation(phongProgram, "uLightPosition");
    phongProgram.uLightColor = gl.getUniformLocation(phongProgram, "uLightColor");
    phongProgram.uAmbientColor = gl.getUniformLocation(phongProgram, "uAmbientColor");
    phongProgram.uDiffuseColor = gl.getUniformLocation(phongProgram, "uDiffuseColor");
    phongProgram.uSpecularColor = gl.getUniformLocation(phongProgram, "uSpecularColor");
    phongProgram.uShininess = gl.getUniformLocation(phongProgram, "uShininess");
    phongProgram.uUseTexture = gl.getUniformLocation(phongProgram, "uUseTexture");
    phongProgram.uSampler = gl.getUniformLocation(phongProgram, "uSampler");
  }

//
// Here you set up your camera position, orientation, and projection
// Remember that your projection and view matrices are sent to the vertex shader
// as uniforms, using whatever name you supply in the shaders
//
function setUpCamera(program) {
    
    gl.useProgram (program);

    // Projection matrix
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI/4, canvas.width/canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(phongProgram.uProjectionMatrix, false, projectionMatrix);
    
    // Light uniforms
    gl.uniform3fv(phongProgram.uLightPosition, lightPosition);
    gl.uniform3fv(phongProgram.uLightColor, lightColor);

    // A simple ambient term
    gl.uniform3fv(phongProgram.uAmbientColor, [0.15, 0.15, 0.2]);
}

function bindVAO(shape, phongProgram) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Positions
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(phongProgram.aVertexPosition);
    gl.vertexAttribPointer(phongProgram.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

    // Normals
    if (shape.normals && shape.normals.length > 0 && phongProgram.aVertexNormal !== -1) {
        const nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(phongProgram.aVertexNormal);
        gl.vertexAttribPointer(phongProgram.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
    }

    if (shape.uv && shape.uv.length > 0 && phongProgram.aTextureCoord !== -1) {
        const tbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.uv), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(phongProgram.aTextureCoord);
        gl.vertexAttribPointer(phongProgram.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
    }

    // Indices
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return vao;
}

function createVAOs() {
    // Create VAOs for each object with appropriate program
    kingBaseVAO = bindVAO(kingBaseShape, phongProgram);
    kingBodyVAO = bindVAO(kingBodyShape, phongProgram);
    kingTopVAO  = bindVAO(kingTopShape, phongProgram);
    kingCrossVAO = bindVAO(kingCrossShape, phongProgram);

    // Create VAO for chess board platform
    platformVAO = bindVAO(platformShape, phongProgram);

    // Create VAO for ground plane
    groundVAO = bindVAO(groundShape, phongProgram);

    // Create VAO for sky/background
    skyVAO = createScreenQuadVAO(skyProgram);
  }

  function drawKing(position, colorType) {
        // position = [x,y,z];
        // colorType = black;

        let diffuse, specular, shininess;
        if (colorType == "black") {
            diffuse = [0.04, 0.04, 0.04];
            specular = [0.85, 0.85, 0.85];
            shininess = 96.0;
        } else {
            diffuse = [0.92, 0.92, 0.95];
            specular = [0.55, 0.55, 0.55];
            shininess = 48.0;
        }
        gl.uniform3fv(phongProgram.uDiffuseColor, diffuse);
        gl.uniform3fv(phongProgram.uSpecularColor, specular);
        gl.uniform1f(phongProgram.uShininess, shininess);
        gl.uniform1i(phongProgram.uUseTexture, 0);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);

        // Shared set-up per part
        const modelMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        const normalMatrix = mat3.create();

        // Draw base of chess piece (wide, squat cylinder)
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, position);
        mat4.scale(modelMatrix, modelMatrix, [1.2, 0.3, 1.2]);

        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

        gl.bindVertexArray(kingBaseVAO);
        gl.drawElements(gl.TRIANGLES, kingBaseShape.indices.length, gl.UNSIGNED_SHORT, 0);

        // Draws body of chess piece (tall central cylinder)
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [position[0], position[1] + 0.6, position[2]]);
        mat4.scale(modelMatrix, modelMatrix, [0.6, 1.5, 0.6]);

        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

        gl.bindVertexArray(kingBodyVAO);
        gl.drawElements(gl.TRIANGLES, kingBodyShape.indices.length, gl.UNSIGNED_SHORT, 0);

        // Draws the top (Sphere = crown)
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [position[0], position[1] + 2.0, position[2]]);
        mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]);

        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

        gl.bindVertexArray(kingTopVAO);
        gl.drawElements(gl.TRIANGLES, kingTopShape.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);

        function drawPart(vao, indexCount, T, S) {
            mat4.identity(modelMatrix);
            mat4.translate(modelMatrix, modelMatrix, T);
            mat4.scale(modelMatrix, modelMatrix, S);

            mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
            mat3.normalFromMat4(normalMatrix, modelViewMatrix);

            gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
            gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

            gl.bindVertexArray(vao);
            gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
        }

        const x = position[0], y = position[1], z = position[2];

        // Base (wide + squat)
        drawPart(
            kingBaseVAO, kingBaseShape.indices.length,
            [x, y, z],
            [1.35, 0.28, 1.35]
        );

        // Collar (thing rish-ish)
      drawPart(
          kingBaseVAO, kingBaseShape.indices.length,
          [x, y + 0.28, z],
          [1.10, 0.15, 1.10]
      );

      // Body (tapered look via smaller radius
      drawPart(
          kingBodyVAO, kingBaseShape.indices.length,
          [x, y + 0.75, z],
          [0.70, 1.35, 0.70]
      );

      // Neck (thin + short)
      drawPart(
          kingBodyVAO, kingBodyShape.indices.length,
          [x, y + 1.70, z],
          [0.42, 0.35, 0.42]
      );

      drawPart(
          kingTopVAO, kingTopShape.indices.length,
          [x, y + 2.15, z],
          [0.55, 0.55, 0.55]
      );

      const headCenterY = y + 2.15;
      const headRadius = 0.55;
      const crossBaseY = headCenterY + headRadius - 0.10;

      const vHeight = 0.45;
      const vHalf = vHeight / 2.0;

      const crossCenterY = crossBaseY + vHalf;

      // Cross Vertical Bar
      drawPart(
          kingCrossVAO, kingCrossShape.indices.length,
          [x, crossCenterY, z],
          [0.12, vHeight, 0.12]
      );
      // Cross Horizontal Bar
      drawPart(
          kingCrossVAO, kingCrossShape.indices.length,
          [x, crossCenterY + 0.02, z],
          [0.38, 0.10, 0.12]
      );
    }

  function drawPlatform() {
    // Use Phong
    gl.useProgram(phongProgram);

    // Enable texture for this draw
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, chessboardTexture);
    gl.uniform1i(phongProgram.uSampler, 0);
    gl.uniform1i(phongProgram.uUseTexture, 1);


    // Board material (subtle specular)
    gl.uniform3fv(phongProgram.uDiffuseColor, [0.35, 0.35, 0.35]);
    gl.uniform3fv(phongProgram.uSpecularColor, [0.6, 0.6, 0.6]);
    gl.uniform3fv(phongProgram.uAmbientColor, [0.15, 0.15, 0.15]);
    gl.uniform1f(phongProgram.uShininess, 12.0);

    // View matrix
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const normalMatrix = mat3.create();

    // Floating board centered at y=1
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [0, 0.9, 0]);
    mat4.scale(modelMatrix, modelMatrix, [6.4, 0.45, 6.4]);

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

    gl.bindVertexArray(platformVAO);
    gl.drawElements(gl.TRIANGLES, platformShape.indices.length, gl.UNSIGNED_SHORT, 0);

    // Turn texture off after (so kings aren't textured)
    gl.uniform1i(phongProgram.uUseTexture, 0);
  }

  function drawGround() {
    gl.useProgram(phongProgram);

    // Texture on
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.uniform1i(phongProgram.uSampler, 0);
    gl.uniform1i(phongProgram.uUseTexture, 1);

    // Ground material (less shiny)
    gl.uniform3fv(phongProgram.uDiffuseColor, [0.85, 0.85, 0.90]);
    gl.uniform3fv(phongProgram.uSpecularColor, [0.01, 0.01, 0.01]);
    gl.uniform3fv(phongProgram.uAmbientColor, [0.18, 0.18, 0.20]);
    gl.uniform1f(phongProgram.uShininess, 1.0);

    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const normalMatrix = mat3.create();

    mat4.lookAt(viewMatrix, cameraPosition, cameraTarget, cameraUp);

    for (let i = 0; i < 18; i++) {
        const z = i * 8.0; // spacing forward
        const lift = 0.012 * i * i; // gentle upward curve
        const scaleZ = 8.0; // strip length

        // Huge flat ground under the board
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [0.0, -2.0 + lift, z]);
        mat4.scale(modelMatrix, modelMatrix, [60.0, 0.1, scaleZ]);

        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        gl.uniformMatrix4fv(phongProgram.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix3fv(phongProgram.uNormalMatrix, false, normalMatrix);

        gl.bindVertexArray(groundVAO);
        gl.drawElements(gl.TRIANGLES, groundShape.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    // texture off for rest
    gl.uniform1i(phongProgram.uUseTexture, 0);
  }

  function createScreenQuadVAO(program) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // 2 triangles covering the screen
    const data = new Float32Array([
        // x, y,    u, v
        -1, -1,     0, 0,
        1, -1,      1, 0,
        -1, 1,      0, 1,

        -1, 1,      0, 1,
        1, -1,      1, 0,
        1,  1,      1, 1
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(skyProgram, "aPos");
    const aUV  = gl.getAttribLocation(skyProgram, "aUV");

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

    gl.bindVertexArray(null);
    return vao;
  }

  function drawShapes() {
    gl.useProgram(phongProgram);
    setUpCamera(phongProgram);

    drawGround();
    drawPlatform();

    // White king
    drawKing([1.8, 1.0, 0.0], "white");

    // Black king
    drawKing([-1.8, 1.0, 0.0], "black");
  }


//
// load up the textures you will use in the shader(s)
// The setup for the globe texture is done for you
// Any additional images that you include will need to
// set up as well.
//
function setUpTextures(){
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    chessboardTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, chessboardTexture);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 255, 255])
    );

    // Set parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    const chessImg = document.getElementById("chessboard-texture");
    chessImg.crossOrigin = "anonymous";

    const upload = () => {
        gl.bindTexture(gl.TEXTURE_2D, chessboardTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, chessImg);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    // If already loaded, upload once, then upload when it loads.
    if (chessImg.complete) {
        upload();
    } else {
        chessImg.onload = upload;
    }

    // ===== Setting up textures for ground texture =====
    groundTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, groundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 255, 255]));
    const groundImg = document.getElementById("ground-texture");

    const uploadGround = () => {
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, groundImg);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);

        draw();
    };

    if (groundImg.complete && groundImg.naturalWidth !== 0) uploadGround();
    else groundImg.onload = uploadGround;
}

function loadSkyTexture() {
    const img = document.getElementById("sky-texture");

    skyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, skyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    const upload = () => {
        gl.bindTexture(gl.TEXTURE_2D, skyTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        // NPOT-safe
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        draw();
    }

    if (img.complete && img.naturalWidth !== 0) upload();
    else img.onload = upload;
}

function drawSkyAndClouds(timeSeconds) {
    // Draw behind everything
    gl.disable(gl.DEPTH_TEST);

    // === SKY ===
    gl.useProgram(skyProgram);
    gl.bindVertexArray(skyVAO);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyTex);
    gl.uniform1i(gl.getUniformLocation(skyProgram, "uSky"), 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // === CLOUDS (alpha) ===
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(cloudProgram);
    gl.bindVertexArray(skyVAO);

    gl.uniform1f(gl.getUniformLocation(cloudProgram, "uTime"), timeSeconds);

    // A few clouds
    const setCloud = (cx, cy, sx, sy) => {
        gl.uniform2f(gl.getUniformLocation(cloudProgram, "uCenter"), cx, cy);
        gl.uniform2f(gl.getUniformLocation(cloudProgram, "uScale"),  sx, sy);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    setCloud(0.25, 0.78, 0.35, 0.18);
    setCloud(0.62, 0.72, 0.40, 0.20);
    setCloud(0.80, 0.82, 0.32, 0.16);

    gl.disable(gl.BLEND);

    // restore for 3d scene
    gl.enable(gl.DEPTH_TEST);
}

//
//  This function draws all of the shapes required for your scene
//


  //
  // Use this function to create all the programs that you need
  // You can make use of the auxillary function initProgram
  // which takes the name of a vertex shader and fragment shader
  //
  // Note that after successfully obtaining a program using the initProgram
  // function, you will beed to assign locations of attribute and unifirm variable
  // based on the in variables to the shaders.   This will vary from program
  // to program.
  //



  // creates a VAO and returns its ID





/////////////////////////////////////////////////////////////////////////////
//
//  You shouldn't have to edit anything below this line...but you can
//  if you find the need
//
/////////////////////////////////////////////////////////////////////////////

// Given an id, extract the content's of a shader script
// from the DOM and return the compiled shader
function getShader(id) {
  const script = document.getElementById(id);
  const shaderString = script.text.trim();

  // Assign shader depending on the type of shader
  let shader;
  if (script.type === 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  else if (script.type === 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else {
    return null;
  }

  // Compile the shader using the supplied shader code
  gl.shaderSource(shader, shaderString);
  gl.compileShader(shader);

  // Ensure the shader is valid
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


  //
  // compiles, loads, links and returns a program (vertex/fragment shader pair)
  //
  // takes in the id of the vertex and fragment shaders (as given in the HTML file)
  // and returns a program object.
  //
  // will return null if something went wrong
  //
  function initProgram(vertex_id, fragment_id) {
    const vertexShader = getShader(vertex_id);
    const fragmentShader = getShader(fragment_id);

    // Create a program
    let program = gl.createProgram();
      
    // Attach the shaders to this program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Could not initialize shaders');
      return null;
    }
      
    return program;
  }


  //
  // We call draw to render to our canvas
  //
  function draw() {
    // Clear the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
    // draw your shapes
    drawShapes();

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  // Entry point to our application
  function init() {
      
    // Retrieve the canvas
    canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
      console.error(`There is no canvas with id ${'webgl-canvas'} on this page.`);
      return null;
    }

    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);

    // Retrieve a WebGL context
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error(`There is no WebGL 2.0 context`);
        return null;
      }
      
    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);
      
    // Set the clear color to be black
    gl.clearColor(0, 0, 0, 1);
      
    // some GL initialization
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clearDepth(1.0)

    // Read, compile, and link your shaders
    initPrograms();
    
    // create and bind your current object
    createShapes();

    createVAOs();

    setUpTextures();

    loadSkyTexture();

    const t = performance.now() * 0.001;
    drawSkyAndClouds(t);
    drawShapes();
    // do a draw
    draw();

    // Starts Animation Loop
    animate();
  }

  function animate() {
    draw();
    requestAnimationFrame(animate);
  }
