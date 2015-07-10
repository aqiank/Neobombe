Neobombe
========
A simplified simulation of Bombe that interfaces with Arduino for moving rotors.

Requirements
------------
1. [Node.js](https://nodejs.org/)
2. Electron (Once Node.js is installed, type `npm -g install electron-prebuilt`. Might require prepending `sudo` on UNIX systems)
3. C++ compiler (GCC/Clang for Linux, XCode for Mac, Visual Studio for Windows)

Installation
------------
1. Go to `neobombe` folder and type `npm install`.
2. Copy the contents of `serialport` into `node_modules/serialport` in `neobombe`.
3. Go to the `node_modules/serialport` folder and type `HOME=~/.electron-gyp node-gyp rebuild --target=0.29.2 --arch=ia64 --dist-url=https://atom.io/download/atom-shell`. Change `--target=0.29.2` to match your Electron version.
