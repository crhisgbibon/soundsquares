"use strict";

function CalculateVh()
{
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
}

window.addEventListener('DOMContentLoaded', CalculateVh);
window.addEventListener('resize', CalculateVh);
window.addEventListener('orientationchange', CalculateVh);

class Deck
{
  name: string = '';
  boards: Board[] = [];
  constructor(name: string, boards: Board[])
  {
    this.name = name;
    this.boards = boards;
  }
}

class Board
{
  index: number = 0;
  name: string = '';
  size: number = 0;
  modules: Module[] = [];
  constructor(index: number, name: string, size: number, modules: Module[])
  {
    this.index = index;
    this.name = name;
    this.size = size;
    this.modules = modules;
  }
}

class Module
{
  index: number = 0;
  name: string = '';
  type: number = 0;
  src: string = '';
  instances: any[] = [];
  color: string = '';
  constructor(index: number, name: string, type: number, src: string, instances: any[], color: string)
  {
    this.index = index;
    this.name = name;
    this.type = type;
    this.src = src;
    this.instances = instances;
    this.color = color;
  }
}

const SquaresButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("SquaresButton");
const i_controlSquares: HTMLElement = <HTMLElement>document.getElementById("i_controlSquares");
// const sGridSizeSelect: HTMLInputElement = <HTMLInputElement>document.getElementById("sGridSizeSelect");
// sGridSizeSelect.onchange = function()
// {
//   CreateGrid(parseInt(sGridSizeSelect.value));
//   FormatGrid();
// }

const sPresetSelect: HTMLInputElement = <HTMLInputElement>document.getElementById("sPresetSelect");
sPresetSelect.onchange = function()
{
  LoadPreset(sPresetSelect.value);
}

// for legacy browsers
// let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext: AudioContext;

let oscList: any[] = [];
let mainGainNode: GainNode;

let noteFreq: any[] = [];
let customWaveform: PeriodicWave;
let sineTerms: Float32Array;
let cosineTerms: Float32Array;

let jsonObj: any;
let audioElements: any[] = [];
let buttonList: HTMLButtonElement [] = [];
let synthType: string;

function SetUp()
{
  NoteTable();
  audioContext = new AudioContext();

  mainGainNode = audioContext.createGain();
  mainGainNode.connect(audioContext.destination);
  mainGainNode.gain.value = 1;

  sineTerms = new Float32Array([0, 0, 1, 0, 1]);
  cosineTerms = new Float32Array(sineTerms.length);
  customWaveform = audioContext.createPeriodicWave(cosineTerms, sineTerms);

  for(let i = 0; i < 9; i++) oscList[i] = {};
}

function LoadPreset(preset: string)
{
  if(audioContext === undefined) SetUp();

  switch(preset)
  {
    case '':
      break;
    case 'soundbank.json':
      LoadLibrary(preset);
      break;
    case 'sine':
      synthType = 'sine';
      LoadSynth();
      break;
    case 'square':
      synthType = 'square';
      LoadSynth();
      break;
    case 'sawtooth':
      synthType = 'sawtooth';
      LoadSynth();
      break;
    case 'triangle':
      synthType = 'triangle';
      LoadSynth();
      break;
    case 'custom':
      synthType = 'custom';
      LoadSynth();
      break;
  }
}

function LoadSynth()
{
  if(noteFreq.length < 88) NoteTable();
  CreateGrid(100);
  FormatGrid();
  AssignSynth();
}

function LoadLibrary(source: string)
{
  jsonObj.length = 0;

  let http_request = new XMLHttpRequest();
  try
  {
    // Opera 8.0+, Firefox, Chrome, Safari
    http_request = new XMLHttpRequest();
  }
  catch(e)
  {
    // Internet Explorer Browsers - irrelevant now
    try
    {
      // http_request = new ActiveXObject("Msxml2.XMLHTTP");	
    }
    catch(e)
    {
      try
      {
        // http_request = new ActiveXObject("Microsoft.XMLHTTP");
      }
      catch(e)
      {
          alert("Your browser sucks.");
          return false;
      }
      
    }
  }

http_request.onreadystatechange = function()
{
  if(http_request.readyState == 4)
  {
    jsonObj = JSON.parse(http_request.responseText);
    
    if(jsonObj.sources.length == 0) return;
    
    CreateGrid(jsonObj.grid);
    FormatGrid();
    
    for(let i = 0; i < jsonObj.sources.length; i++)
    {
      AssignSound(jsonObj.sources[i]);
    }
  }
}
http_request.open("GET", source, true);
http_request.send();
}

function CreateGrid(size: number)
{
  let sbox: HTMLElement = <HTMLElement>document.getElementById("sBox")
  sbox.innerHTML = '';

  buttonList.length = 0;

  for(let i = 0; i < size; i++)
  {
    let newButton = document.createElement("button");
    newButton.className = "soundSquareButton";
    newButton.id = "soundButton" + i;
    buttonList.push(newButton);
    sbox.appendChild(newButton);
  }
}

function FormatGrid()
{
  let h = $('#sContents').css('height');

  $('#sBox').css("height" , h);
  $('#sBox').css("width" , h);

  let squareSize = 0;

  if(buttonList.length == 1)
  {
    squareSize = 100;
  }
  else
  {
    squareSize = 100 / Math.sqrt(buttonList.length);
  }

  $('.soundSquareButton').css("height" , squareSize + '%');
  $('.soundSquareButton').css("width" , squareSize + '%');
}

function AssignSound(object: any)
{
  // get the audio element
  let audioElArr: HTMLAudioElement[] = [];

  for(let i = 0; i < object.instances; i++)
  {
    let newAudio = document.createElement("audio");
    newAudio.src = object.src;
    audioElArr.push(newAudio);
  }
  audioElements.push(audioElArr);
  // pass it into the audio context
  let track = audioContext.createMediaElementSource(audioElArr[audioElArr.length-1]);
  track.connect(audioContext.destination);

  buttonList[object.index].className = "soundSquareButton";
  buttonList[object.index].id = "soundButton" + object.index;
  buttonList[object.index].innerHTML = object.name;
  buttonList[object.index].style.backgroundColor = object.color;

  buttonList[object.index].addEventListener('click', function()
  {
    // check if context is in suspended state (autoplay policy)
    if(audioContext.state === 'suspended')
    {
      audioContext.resume();
      for(let i = 0; i < audioElArr.length; i++)
      {
        if(audioElArr[i].paused)
        {
          audioElArr[i].play();
          break;
        }
      }
    }
    else
    {
      for(let i = 0; i < audioElArr.length; i++)
      {
        if(audioElArr[i].paused)
        {
          audioElArr[i].play();
          break;
        }
      }
    }
  }, false);
}

function AssignSynth()
{
  if(buttonList.length < 88) return;

  let counter = 0;

  noteFreq.forEach(function(keys, idx)
  {
    let keyList = Object.entries(keys);
    keyList.forEach(function(key: any)
    {
      // console.log(key);
      buttonList[counter].className = "soundSquareButton";
      buttonList[counter].id = "soundButton" + counter;
      buttonList[counter].innerHTML = key[0] + "/" + idx;
      
      buttonList[counter].dataset["octave"] = idx.toString();
      buttonList[counter].dataset["note"] = key[0];
      buttonList[counter].dataset["frequency"] = key[1].toString();
      
      //buttonList[counter].addEventListener("mousedown", NotePressed, false);
      //buttonList[counter].addEventListener("mouseup", NoteReleased, false);
      buttonList[counter].addEventListener("mouseover", NotePressed, false);
      buttonList[counter].addEventListener("mouseleave", NoteReleased, false);
      
      counter++;
    });
  });
}

function PlayNote(freq: number)
{
  let osc = audioContext.createOscillator();
  osc.connect(mainGainNode);

  if(synthType == "custom")
  {
    osc.setPeriodicWave(customWaveform);
  }
  else
  {
    osc.type = <OscillatorType>synthType;
  }

  osc.frequency.value = freq;
  osc.start();

  return osc;
}

let mouseDown: boolean = false;
document.body.onmousedown = function() { 
  mouseDown = true;
}
document.body.onmouseup = function() {
  mouseDown = false;
}

function NotePressed(event: any)
{
  let dataset = event.target.dataset;
  if(!mouseDown) return;

  if(!dataset["pressed"])
  {
    let octave = +dataset["octave"];
    oscList[octave][dataset["note"]] = PlayNote(dataset["frequency"]);
    dataset["pressed"] = "yes";
    dataset["state"] = "selected";
  }
}

function NoteReleased(event: any)
{
  let dataset = event.target.dataset;

  if(dataset && dataset["pressed"])
  {
    let octave = +dataset["octave"];
    oscList[octave][dataset["note"]].stop();
    delete oscList[octave][dataset["note"]];
    delete dataset["pressed"];
    delete dataset["state"];
  }
}

function NoteTable()
{
  noteFreq = [];

  for(let i = 0; i < 9; i++)
  {
    noteFreq[i] = [];
  }

  noteFreq[0]["A"] = 27.500;
  noteFreq[0]["A#"] = 29.135;
  noteFreq[0]["B"] = 30.868;

  noteFreq[1]["C"] = 32.703;
  noteFreq[1]["C#"] = 34.648;
  noteFreq[1]["D"] = 36.708;
  noteFreq[1]["D#"] = 38.891;
  noteFreq[1]["E"] = 41.203;
  noteFreq[1]["F"] = 43.654;
  noteFreq[1]["F#"] = 46.249;
  noteFreq[1]["G"] = 48.999;
  noteFreq[1]["G#"] = 51.913;
  noteFreq[1]["A"] = 55.000;
  noteFreq[1]["A#"] = 58.270;
  noteFreq[1]["B"] = 61.735;

  noteFreq[2]["C"] = 65.406;
  noteFreq[2]["C#"] = 69.296;
  noteFreq[2]["D"] = 	73.416;
  noteFreq[2]["D#"] = 77.782;
  noteFreq[2]["E"] = 82.407;
  noteFreq[2]["F"] = 87.307;
  noteFreq[2]["F#"] = 92.499;
  noteFreq[2]["G"] = 97.999;
  noteFreq[2]["G#"] = 103.826;
  noteFreq[2]["A"] = 110;
  noteFreq[2]["A#"] = 116.541;
  noteFreq[2]["B"] = 123.471;

  noteFreq[3]["C"] = 130.813;
  noteFreq[3]["C#"] = 138.591;
  noteFreq[3]["D"] = 146.832;
  noteFreq[3]["D#"] = 155.563;
  noteFreq[3]["E"] = 164.814;
  noteFreq[3]["F"] = 174.614;
  noteFreq[3]["F#"] = 184.997;
  noteFreq[3]["G"] = 195.998;
  noteFreq[3]["G#"] = 207.652;
  noteFreq[3]["A"] = 220.000;
  noteFreq[3]["A#"] = 233.082;
  noteFreq[3]["B"] = 246.942;

  noteFreq[4]["C"] = 261.626;
  noteFreq[4]["C#"] = 277.183;
  noteFreq[4]["D"] = 293.665;
  noteFreq[4]["D#"] = 311.127;
  noteFreq[4]["E"] = 329.628;
  noteFreq[4]["F"] = 349.228;
  noteFreq[4]["F#"] = 369.994;
  noteFreq[4]["G"] = 391.995;
  noteFreq[4]["G#"] = 415.305;
  noteFreq[4]["A"] = 440.000;
  noteFreq[4]["A#"] = 466.164;
  noteFreq[4]["B"] = 493.883;

  noteFreq[5]["C"] = 523.251;
  noteFreq[5]["C#"] = 554.365;
  noteFreq[5]["D"] = 587.33;
  noteFreq[5]["D#"] = 622.254;
  noteFreq[5]["E"] = 659.255;
  noteFreq[5]["F"] = 698.456;
  noteFreq[5]["F#"] = 739.989;
  noteFreq[5]["G"] = 783.991;
  noteFreq[5]["G#"] = 830.609;
  noteFreq[5]["A"] = 880.000;
  noteFreq[5]["A#"] = 932.328;
  noteFreq[5]["B"] = 987.767;

  noteFreq[6]["C"] = 1046.502;
  noteFreq[6]["C#"] = 1108.731;
  noteFreq[6]["D"] = 1174.659;
  noteFreq[6]["D#"] = 1244.508;
  noteFreq[6]["E"] = 1318.51;
  noteFreq[6]["F"] = 1396.913;
  noteFreq[6]["F#"] = 1479.978;
  noteFreq[6]["G"] = 1567.982;
  noteFreq[6]["G#"] = 1661.219;
  noteFreq[6]["A"] = 1760.000;
  noteFreq[6]["A#"] = 1864.655;
  noteFreq[6]["B"] = 1975.533;

  noteFreq[7]["C"] = 2093.005;
  noteFreq[7]["C#"] = 2217.461;
  noteFreq[7]["D"] = 2349.318;
  noteFreq[7]["D#"] = 2489.016;
  noteFreq[7]["E"] = 2637.021;
  noteFreq[7]["F"] = 2793.826;
  noteFreq[7]["F#"] = 2959.955;
  noteFreq[7]["G"] = 3135.964;
  noteFreq[7]["G#"] = 3322.438;
  noteFreq[7]["A"] = 3520.000;
  noteFreq[7]["A#"] = 3729.310;
  noteFreq[7]["B"] = 3951.066;

  noteFreq[8]["C"] = 4186.009;
}

window.addEventListener('resize', FormatGrid);