// Modules to control application life and create native browser window
const {app, BrowserWindow,ipcMain,webContents} = require('electron')
const superagent = require('superagent');
var querystring = require('querystring');
var https = require("https");
global.sharedObj = {prop1: null};
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var acc='';

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
   mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('close', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null

  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.





var options = {
    client_id: 'cc9c60bbe5f66b6fdd2b',
    client_secret: 'fbb6f9c267ca5d5f6b324e8caa05f6a34c2ea5ed',
    scopes: ["repo","user"] // Scopes limit access for OAuth tokens.
};

ipcMain.on("request-auth", function(e) {
    console.log('clicked...');
    // Your GitHub Applications Credentials
    var options = {
        client_id    : 'cc9c60bbe5f66b6fdd2b',
        client_secret: 'fbb6f9c267ca5d5f6b324e8caa05f6a34c2ea5ed',
        scopes       : ["repo","user"], // Scopes limit access for OAuth tokens.
        access_token : ''

    };

// Build the OAuth consent page URL
    var authWindow = new BrowserWindow({width: 800, height: 600, show: false, 'node-integration': false});
    var githubUrl  = 'https://github.com/login/oauth/authorize?';
    var authUrl    = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes;
    authWindow.loadURL(authUrl);
    authWindow.show();
    authWindow.webContents.send("got-access-token", "ss");


    function handleCallback(url) {
        var raw_code = /code=([^&]*)/.exec(url) || null;
        var code     = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
        var error    = /\?error=(.+)$/.exec(url);

        console.log("로우코드는?"+raw_code);
        console.log("코드는?"+code);

        if (code || error) {
            // Close the browser if code found or error
            authWindow.destroy();
        }

        // If there is a code, proceed to get token from github
        if (code) {
            requestGithubToken(options, code);

        } else if (error) {
            alert('Oops! Something went wrong and we couldn\'t' +
                'log you in using Github. Please try again.');
        }
    }
    //http test
    function handleCallback_http(url) {
        var raw_code = /code=([^&]*)/.exec(url) || null;
        var code     = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
        var error    = /\?error=(.+)$/.exec(url);

        if (code || error) {
            // Close the browser if code found or error
            authWindow.destroy();
        }
        // If there is a code in the callback, proceed to get token from github
        if (code) {
            console.log("code recieved: " + code);

            var postData = querystring.stringify({
                "client_id" : options.client_id,
                "client_secret" : options.client_secret,
                "code" : code
            });

            var post = {
                host: "github.com",
                path: "/login/oauth/access_token",
                method: "POST",
                headers:
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length,
                        "Accept": "application/json"
                    }
            };

            var req = https.request(post, function(response){
                var result = '';
                response.on('data', function(data) {
                    result = result + data;
                });
                response.on('end', function () {
                    var json = JSON.parse(result.toString());
                    console.log("access token recieved: " + json.access_token);
                    // sharedObj.prop1=json.access_token;
                    // console.log("sharedObj.prop1?"+sharedObj.prop1);
                    acc=json.access_token;
                    requestGithubInfo(acc)


                    if (response && response.ok) {
                        // Success - Received Token.
                        // Store it in localStorage maybe?
                        console.log(response.body.access_token);
                    }
                });
                response.on('error', function (err) {
                    console.log("GITHUB OAUTH REQUEST ERROR: " + err.message);
                });
            });

            req.write(postData);
            req.end();
        } else if (error) {
            alert("Oops! Something went wrong and we couldn't log you in using Github. Please try again.");
        }
    }

// Handle the response from GitHub - See Update from 4/12/2015

    authWindow.webContents.on('did-navigate', function (event, url) {
        console.log("did-navigate done ");
       // handleCallback(url);
        handleCallback_http(url)
        //console.log("acc는?"+acc);

    });

    authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
        console.log("did-get-redirect-request ");
        handleCallback(newUrl);
    });

// Reset the authWindow on close
    authWindow.on('close', function () {
        authWindow = null;
    }, false);



})

//받은 Authorization code를 이용해서 access_token을 획득한다
function requestGithubToken(options, code){
    superagent
        .post('https://github.com/login/oauth/access_token', {
            client_id: options.client_id,
            client_secret: options.client_secret,
            code: code,
        })
        .end(function (err, response) {
            if (response && response.ok) {
                console.log("성공");
                // Success - Received Token.
                // Store it in localStorage maybe?
                // console.log(response);
                window.localStorage.setItem('githubtoken', response.body.access_token);
                acc=response.body.access_token;
                //console.log("acc는?"+acc);

            } else {
                console.log("실패?");
                // Error - Show messages.
                console.log(err);
            }
        });
    requestGithubInfo(acc);
    mainWindow.webContents.on('did-finish-load',function () {
        mainWindow.webContents.send('ping','woooo')
    })

}


function requestGithubInfo(options){
    //console.log("acc는?"+acc)
    superagent
        .get('https://api.github.com/user?access_token='+options)
        .end(function (err, response) {
            if (response && response.ok) {
                console.log("성공");
                // Success - Received Token.
                // Store it in localStorage maybe?
                console.log(response.body.login);


                mainWindow.webContents.send("got-access-token", response.body.login);


            mainWindow.webContents.on('did-finish-load',function () {
                mainWindow.webContents.send('ping','woooo')
            })


                ipcMain.on('asynchronous-message', function(event, arg){
                    console.log(arg)  // "ping" 출력
                event.sender.send('asynchronous-reply', 'pong')
            })


                //window.localStorage.setItem('githubtoken', response.body.access_token);
            } else {
                console.log("실패?");
                // Error - Show messages.
                console.log(err);
            }
        });

}

ipcMain.on("did-get-redirect-request", function(e) {
    var querystring = require('querystring');
    var https = require("https");

    console.log('clicked...');
    // Your GitHub Applications Credentials
    var options = {
        client_id    : 'cc9c60bbe5f66b6fdd2b',
        client_secret: 'fbb6f9c267ca5d5f6b324e8caa05f6a34c2ea5ed',
        scopes       : ["repo"] // Scopes limit access for OAuth tokens.
    };

    var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });
    var githubUrl = 'https://github.com/login/oauth/authorize?';
    var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes;
    authWindow.loadURL(authUrl);
    authWindow.show();
    console.log("여기까진 진입?");
    authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {
        var raw_code = /code=([^&]*)/.exec(newUrl) || null,
            code = (raw_code && raw_code.length > 1) ? raw_code[1] : null,
            error = /\?error=(.+)$/.exec(newUrl);
        console.log("로우코드는?"+raw_code);
        console.log("코드는?"+code);
        if (code || error) {
            // Close the browser if code found or error
            authWindow.close();
        }

        // If there is a code in the callback, proceed to get token from github
        if (code) {
            console.log("code recieved: " + code);

            var postData = querystring.stringify({
                "client_id" : options.client_id,
                "client_secret" : options.client_secret,
                "code" : code
            });

            var post = {
                host: "github.com",
                path: "/login/oauth/access_token",
                method: "POST",
                headers:
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length,
                        "Accept": "application/json"
                    }
            };

            var req = https.request(post, function(response){
                var result = '';
                response.on('data', function(data) {
                    result = result + data;
                });
                response.on('end', function () {
                    var json = JSON.parse(result.toString());
                    console.log("access token recieved: " + json.access_token);

                    if (response && response.ok) {
                        // Success - Received Token.
                        // Store it in localStorage maybe?
                        console.log(response.body.access_token);
                    }
                });
                response.on('error', function (err) {
                    console.log("GITHUB OAUTH REQUEST ERROR: " + err.message);
                });
            });

            req.write(postData);
            req.end();
        } else if (error) {
            alert("Oops! Something went wrong and we couldn't log you in using Github. Please try again.");
        }
    });

// Reset the authWindow on close
    authWindow.on('close', function() {
        authWindow = null;
    }, false);
})
