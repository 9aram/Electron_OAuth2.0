// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require('electron');

// ipcRenderer.on("got-access-token", function(ss){
//     document.getElementById("myParagraph").innerText="ssss";
// });