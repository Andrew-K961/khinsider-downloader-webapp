const loadBtn = document.getElementById('loadBtn');
const url = document.getElementById('khlink');
const statusText = document.getElementById('status');
const trackList = document.getElementById('trackList');
const folderSelectBtn = document.getElementById('folderSelectBtn');
const ddirInput = document.getElementById('downloadDir');
const downloadBtn = document.getElementById('downloadBtn');
const dirList = document.getElementById('fileList');
const popupOverlay = document.getElementById('popupOverlay');
const closePopup = document.getElementById('closePopup');
const dirNavUpBtn = document.getElementById('dirNavUp');
const currentDirDisplay = document.getElementById('currentDir');
const selectDirBtn = document.getElementById('dirSelectedBtn');
const newDirBtn = document.getElementById('newDirBtn');
const socket = io();
let loadResult;
let rootDir = '';
let platform = 'linux';
let currentDir = '';

// for testing 
/*
let loadResult = {
    status: '4 links acquired. Select which tracks to download with checkboxes.',
    track_names: [
      'Snake Eater',
      "''METAL GEAR SOLID'' Main Theme (METAL GEAR SOLID 3 Version)",
      "Don't Be Afraid",
      'Snake Eater (Instrumental)'
    ],
    track_urls: [
      'https://downloads.khinsider.com/game-soundtracks/album/snake-eater-song-from-metal-gear-solid-3/01%2520Snake%2520Eater.mp3',
      'https://downloads.khinsider.com/game-soundtracks/album/snake-eater-song-from-metal-gear-solid-3/02%2520%2527%2527METAL%2520GEAR%2520SOLID%2527%2527%2520Main%2520Theme%2520%2528METAL%2520GEAR%2520SOLID%25203%2520Version%2529.mp3',
      'https://downloads.khinsider.com/game-soundtracks/album/snake-eater-song-from-metal-gear-solid-3/03%2520Don%2527t%2520Be%2520Afraid.mp3',
      'https://downloads.khinsider.com/game-soundtracks/album/snake-eater-song-from-metal-gear-solid-3/04%2520Snake%2520Eater%2520%2528Instrumental%2529.mp3'
    ]
};*/

document.addEventListener('DOMContentLoaded', () => {
    ddirInput.value = getCookie('download_directory');
    if (ddirInput.value != ''){
        currentDir = ddirInput.value;
    }
})

function loadDirectories() {
    socket.timeout(5000).emit('loadDirs', currentDir, (err, response) => {
        if (err) {
            let err_msg = 'Web Socket timed out waiting for response from server';
            console.log(err_msg);
            alert(err_msg);
        } else {
            if (response.error != '') {
                currentDir = '';
                alert(response.error);
                return;
            }
            console.log(response.dirs);
            dirList.innerHTML = '';
            let index = 0;
            response.dirs.forEach(dir => {
                dirList.innerHTML += `<p id='dirName${index}' class="directory">${dir}</p>`;
                index++;
            });
        }
    })
    if (rootDir === '') {
        rootDir = platform === 'win32' ? 'C:\\' : '/';
    }
    currentDirDisplay.innerText = rootDir.concat(currentDir);
}

function getOSPathDelimiter () {
    return platform === 'win32' ? '\\' : '/';
}

loadBtn.addEventListener('click', (_event) => {
    _event.preventDefault();
    console.log(JSON.stringify({ input: url.value }));
    socket.emit('loadUrl', { input: url.value });
})

folderSelectBtn.addEventListener('click', async (_event) => {
    _event.preventDefault();
    popupOverlay.style.display = 'block';
    const response = await socket.timeout(5000).emitWithAck('getPlatform');
    platform = response.platform;
    loadDirectories();
})

dirList.addEventListener('click', (_event) => {
    //console.log(_event.target.innerText);
    //console.log(_event.target.nodeName == 'P');
    if (_event.target && _event.target.nodeName == 'P') {
        currentDir = _event.target.innerText;
        console.log(_event.target.id);
        loadDirectories();
    }
})

dirNavUpBtn.addEventListener('click', (_event) => {
    let fileDelimeter = getOSPathDelimiter();
    const pathArray = currentDir.split(fileDelimeter);
    pathArray.pop();
    currentDir = pathArray.join(fileDelimeter);
    loadDirectories();
})

newDirBtn.addEventListener('click', (_event) => {
    dirList.innerHTML += '<input id="newDirInput" type="text"></input>';
    const newDirInput = document.getElementById('newDirInput');
    newDirInput.focus();
})

document.addEventListener('keydown', (_event) => {
    console.log(document.activeElement.id);
    if (_event.keyCode === 13 && document.activeElement.id === 'newDirInput') {
        const input = document.getElementById('newDirInput');
        request_mkdir(rootDir.concat(currentDir, getOSPathDelimiter(), input.value));
    }
})

function request_mkdir (dirPath) {
    socket.timeout(5000).emit('mkdir', dirPath, (err, response) => {
        if (err) {
            let err_msg = 'Web Socket timed out waiting for response from server';
            console.log(err_msg);
            alert(err_msg);
        } else {
            if (response.status === ''){
                loadDirectories();
            } else {
                alert(response.status);
            }
        }
    })
}

selectDirBtn.addEventListener('click', (_event) => {
    ddirInput.value = currentDirDisplay.innerText;
    setCookie('download_directory', currentDirDisplay.innerText, 365);
    closePopupFunc();
})

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

downloadBtn.addEventListener('click', (_event) => {
    _event.preventDefault();
    let downloadDir = ddirInput.value;
    if (downloadDir === '') {
        statusText.innerText = 'Status: [ERROR] Provide download path.';
        return;
    } else if (loadResult === undefined || loadResult.track_names === '') {
        statusText.innerHTML = 'Status: [ERROR] Load URL.';
        return;
    }

    setCookie('download_directory', ddirInput.value, 365);

    loadBtn.disabled = true;

    let jsonOut = JSON.parse(JSON.stringify(loadResult));
    let inputs = document.getElementsByClassName('check');
    for (let i = loadResult.track_names.length - 1; i >= 0; i--) {
        console.log(inputs[i].checked)
        if (!inputs[i].checked) {
            jsonOut.track_names[i] = '';
            jsonOut.track_urls[i] = '';
        }
    }

    jsonOut.download_directory = downloadDir;
    console.log(JSON.stringify(jsonOut));

    socket.emit('download', jsonOut);
})

socket.on('statusUpdate', (response) => {
    loadResult = JSON.parse(response);
    statusText.innerText = 'Status: ' + loadResult.status;
    console.log('State: ' + loadResult.state);

    if (loadResult.state === 3) {
        loadBtn.disabled = true;
    } else {
        loadBtn.disabled = false;
        trackList.innerHTML = '';
    }

    if (loadResult.track_names != '' && loadResult.state != 3) {
        for (let trackName of loadResult.track_names) {
            trackList.innerHTML +=
                `<div class="track">
                <p>${trackName}.mp3</p>
                <input type="checkbox" class="check" checked>
                </div>`;
        }
    }
});

// Function to open the popup
function openPopup() {
    popupOverlay.style.display = 'block';
}

// Function to close the popup
function closePopupFunc() {
    //console.log('reached')
    popupOverlay.style.display = 'none';
}

closePopup.addEventListener('click', closePopupFunc);

// Close the popup when clicking outside the popup content
popupOverlay.addEventListener('click', function (event) {
    if (event.target === popupOverlay) {
        closePopupFunc();
    }
});