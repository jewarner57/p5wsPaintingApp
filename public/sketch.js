// Name any p5.js functions we use in `global` so Glitch can recognize them.
/* global
 *    HSB, background, color, colorMode, createCanvas, ellipse, fill, height, line, mouseIsPressed,
 *    mouseX, mouseY, rect, stroke, strokeWeight, width, textSize, text, backgroundColor, noStroke, mousePressed, key
 *    keyIsDown, random
 */

let socket;
let brushHue;
let brushSaturation = 100
let brushBrightness = 100
let brushColorMode = "positional"
let priorX, priorY
let lineSize = 0;
let lineShrink = false;

function setup() {
  // Canvas & color settings
  createCanvas(800, 800);
  colorMode(HSB, 360, 100, 100);

  background(90)

  socket = io.connect('http://localhost:3000')

  socket.on('updateCanvas', newDrawing)

  // Initialize brushHue to 0 (which is delcared at the top)
  brushHue = 0;
}

function newDrawing(data) {

  fill(data.H, data.S, data.B)
  stroke(data.H, data.S, data.B)
  strokeWeight(data.strokeWeight)

  if (data.shape === "line") {
    line(data.x, data.y, data.priorX, data.priorY)
  }
  else if (data.shape === "rect") {
    rect(data.x, data.y, data.width, data.height)
  }
}

function draw() {
  // Draw the background to clear the screen at the beginning of the frame

  drawColorPicker()

  // Draw a 15 x 15 sized square at mouseX and mouseY

  let shape;

  if (mouseIsPressed || keyIsDown(83)) {
    chooseColors()
    line(mouseX, mouseY, priorX, priorY)
    sendCanvasChanges("line")
  }
  if (keyIsDown(70)) {
    chooseColors()
    rect(mouseX, mouseY, Math.abs(mouseX - priorX), Math.abs(mouseY - priorY))
    sendCanvasChanges("rect")
  }

  priorX = mouseX
  priorY = mouseY

}

function sendCanvasChanges(shape) {
  //send what was drawn to the server
  let data = {
    x: mouseX,
    y: mouseY,
    priorX: priorX,
    priorY: priorY,
    shape: shape,
    H: brushHue,
    S: brushSaturation,
    B: brushBrightness,
    width: Math.abs(mouseX - priorX),
    height: Math.abs(mouseY - priorY),
    strokeWeight: lineSize
  }

  socket.emit('canvasChanged', data)
}

function keyTyped() {
  if (key === 'd') {
    background(90)
  }
  if (key === 'a') {
    if (brushColorMode === 'positional') {
      brushColorMode = 'random'
    }
    else if (brushColorMode === "random") {
      brushColorMode = 'fade'
    }
    else if (brushColorMode === 'fade') {
      brushColorMode = 'select'
    }
    else {
      brushColorMode = 'positional'
    }
  }
  if (key === 'z') {
    if (brushSaturation < 100) {
      brushSaturation += 5
    }
    else {
      brushSaturation = 0
    }
  }
  if (key === 'x') {
    if (brushBrightness < 100) {
      brushBrightness += 5
    }
    else {
      brushBrightness = 0
    }
  }
}

/* A function that sets the stroke and fill of our "paint brush". */
function chooseColors() {

  if (brushColorMode === 'positional') {
    brushHue = Math.floor(mouseX / (width / 360))
  }
  else if (brushColorMode === 'random') {
    brushHue = Math.floor(random(0, 360))
  }
  else if (brushColorMode === 'fade') {
    if (brushHue < 360) {
      brushHue++
    }
    else {
      brushHue = 0
    }
  }
  else if (brushColorMode === 'select' && mouseY < 40) {
    brushHue = Math.floor(mouseX / (width / 360))
  }



  if (lineSize < 15 && lineShrink === false) {
    lineSize++
  }
  else {
    lineShrink = true
  }

  if (lineSize > 5 && lineShrink === true) {
    lineSize--
  }
  else {
    lineShrink = false
  }


  strokeWeight(lineSize)

  stroke(brushHue, brushSaturation, brushBrightness);
  fill(brushHue, brushSaturation, brushBrightness);
}

function drawColorPicker() {
  fill(255)
  strokeWeight(10)
  rect(0, 0, width, 80)
  rect(0, height - 80, width, 80)
  stroke(0)
  fill(0)
  strokeWeight(0);
  textSize(20)
  text("HSB: (" + brushHue + "," + brushSaturation + "," + brushBrightness + ")", 20, 65)
  text("Color Mode: " + brushColorMode + " Toggle with (a)", width - 350, 65)
  textSize(18)
  text("Draw Line (S), Draw Square (F), Clear Screen (D), Change Saturation (z), Change Brightness (x)", 20, height - 30)

  for (let i = 0; i < width; i++) {
    noStroke()
    fill(Math.floor(i / (width / 360)), brushSaturation, brushBrightness)
    ellipse(i, 10, 50)
  }
}

//I guess you could theoretically use this as a HSB color picker, but it wouldn't be very practical without sliders for saturation
//and brightness. Pressing a key to rotate through the values is slow and isn't precise enough.