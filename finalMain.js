  'use strict';


  var mat4 = glMatrix.mat4;
  var mat3 = glMatrix.mat3;

  // Global variables that are set and used
  // across the application
  let gl;

  // GLSL programs
  let phongProgram

  
  // VAOs for the objects
  let kingBaseVAO, kingBodyVAO, kingTopVAO;


  // textures



  // rotation


  // King Chess Shapes
  let kingBaseShape, kingBodyShape, kingTopShape;

// Camera control variables
let cameraPosition = [10, 8, 10];
let cameraTarget = [0, 0, 0];
let cameraUp = [0, 1, 0];


// Lighting
let lightPosition = [5, 10, 5];
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

}

function initPrograms() {
      // Initialize all shader programs
    phongProgram = initProgram("phong-V", "phong-F");


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
    mat4.perspective(projectionMatrix, Math.PI/4, 1.0, 0.1, 100.0);
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
  }

  function drawKing(position, colorType) {
        // position = [x,y,z];
        // colorType = black;

        let diffuse, specular, shininess;
        if (colorType == "black") {
            diffuse = [0.08, 0.08, 0.10];
            specular = [1.0, 1.0, 1.0];
            shininess = 32.0;
        } else {
            diffuse = [0.90, 0.90, 0.95];
            specular = [0.6, 0.6, 0.7];
            shininess = 32.0;
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
    }

  function drawShapes() {
    gl.useProgram(phongProgram);
    setUpCamera(phongProgram);

    // White king
    drawKing([1.5, 1.0, 0], "white");

    // Black king
    drawKing([-1.5, 1.0, 0], "black");
  }


//
// load up the textures you will use in the shader(s)
// The setup for the globe texture is done for you
// Any additional images that you include will need to
// set up as well.
//
function setUpTextures(){
    
    // flip Y for WebGL

    // get some texture space from the gpu
    // Create and set up chessboard texture

    // load the actual image
    var worldImage = document.getElementById ('')
    worldImage.crossOrigin = "";
        
    // bind the texture so we can perform operations on it
        
    // load the texture data
        
    // set texturing parameters
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
    const canvas = document.getElementById('webgl-canvas');
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
    
    // do a draw
    draw();

    // Starts Animation Loop
    animate();
  }

  function animate() {
    draw();
    requestAnimationFrame(animate);
  }
