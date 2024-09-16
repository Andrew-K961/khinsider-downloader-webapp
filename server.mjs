import express from "express";
import path from 'path'
import { createServer } from 'node:http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PythonShell } from 'python-shell';
import { Server } from 'socket.io';
import fs from 'fs';
import { readdir } from 'node:fs/promises';

let urlIndexer = new PythonShell('./indexer.py', { mode: 'json' });
let downloader = new PythonShell('./downloader.py', { mode: 'json' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = 3000;

let rootDir;
if (process.platform === 'win32') {
    rootDir = 'C:\\';
} else {
    rootDir = '/';
}


/*fs.readdir(path.join(rootDir, "Users"), (err, files) => {
    files.forEach(file => {
        //if (file.isDirectory()){
            console.log(file);
        //}
    });
});*/

io.on('connection', (socket) => {
    console.log(socket.handshake.address);

    socket.on('loadUrl', (url) => {
        urlIndexer.send(url);
    });

    socket.on('download', (jsonList) => {
        downloader.send(jsonList);
    });

    socket.on('getPlatform', (callback) => {
        callback({
            platform: process.platform
        })
    })

    socket.on('mkdir', (path, callback) => {
        let status = ''
        
        try {
            fs.mkdirSync(path);
        } catch (error) {
            console.log(error.message);
            status = error.message;
        }

        callback({
            status: status
        })
    })

    socket.on('loadDirs', async (priorPath, callback) => {
        let dirsArray = [''];
        let err = ''
        //console.log(path.join(rootDir, priorPath));
        let files;
        try {
            files = await readdir(path.join(rootDir, priorPath), { withFileTypes: true });
        } catch (error) {
            err = error.message
            console.log(err);
        }

        if (err === ''){
            files.forEach(file => {
                if (file.isDirectory()) {
                    //console.log(file.name);
                    dirsArray.push(path.join(priorPath, file.name));
                }
            });
        }
        /*fs.readdir(path.join(rootDir, priorPath), { withFileTypes: true }, (err, files) => {
            files.forEach(file => {
                if (file.isDirectory()){
                    console.log(file.name);
                    dirsArray.push(path.join(rootDir, priorPath, file.name));
                }
            });
        });*/
        //console.log(dirsArray);
        callback({
            dirs: dirsArray,
            error: err
        });
    });

    socket.onAny((eventName, ...args) => {
        console.log(eventName);
        console.log(args);
    });

    socket.onAnyOutgoing((eventName, ...args) => {
        console.log(eventName);
        console.log(args);
    });
});

app.use(express.static(__dirname + '/public'));

app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join('/index.html'));
});

server.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});

urlIndexer.on('message', function (message) {
    console.log(message);
    io.emit('statusUpdate', JSON.stringify(message));
});

downloader.on('message', function (message) {
    console.log(message);
    io.emit('statusUpdate', JSON.stringify(message));
});