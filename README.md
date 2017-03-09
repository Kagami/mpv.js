<h1 align="center">
  <br>
  <a href="https://mpv.io/">
    <img src="https://i.imgur.com/qQFg0aI.png" alt="mpv" width="200">
  </a>
  <br>mpv.js<br><br>
</h1>

<h4 align="center">
  All format embeddable player for Electron/NW.js applications.
  <br>
  Powered by <a href="https://mpv.io/">mpv</a>.
</h4>

<p align="center">
  <a href="http://travis-ci.org/Kagami/mpv.js">
    <img src="https://img.shields.io/travis/Kagami/mpv.js.svg" alt="Travis">
  </a>
  <a href="https://npmjs.org/package/mpv.js">
    <img src="https://img.shields.io/npm/v/mpv.js.svg" alt="NPM">
  </a>
</p>

## Get libmpv

In order to use mpv.js you need to install mpv library first.

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack, put corresponding `mpv-1.dll` to `C:\Windows\system32`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv1`

## Usage

## Example

![](https://i.imgur.com/tLFkATs.png)

[Simple Electron application](example) yet capable of handling pretty much any available video thanks to mpv. Run:

```bash
git clone https://github.com/Kagami/mpv.js.git && cd mpv.js
npm install
npm run example
```

## Build

In order to build `mpvjs.node` by yourself you need to setup build environment.

### Step 1: setup node-gyp

See [installation](https://github.com/nodejs/node-gyp#installation) section.

* Windows: Visual Studio 2013 is required

### Step 2: setup NaCl SDK

See [download](https://developer.chrome.com/native-client/sdk/download) page.

* Windows: unpack `nacl_sdk.zip` to `C:\`
* macOS & Linux: add `export NACL_SDK_ROOT=/path/to/pepper_49` to `~/.bash_profile`

### Step 2.1: compile 64-bit NaCl host binaries on Windows

1. Open `C:\nacl_sdk\pepper_49\tools\host_vc.mk` and replace `32_host` with `64_host`
2. Open cmd, run `"C:\Program Files (x86)\Microsoft Visual Studio 12.0\VC\vcvarsall.bat" amd64`
3. Run `cd C:\nacl_sdk\pepper_49\src` and `make TOOLCHAIN=win`

### Step 3: setup mpv development files

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack to `C:\mpv-dev`, rename `include` to `mpv`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv-dev`

### Step 4: build plugin

* Run `node-gyp rebuild` in project directory
* Run `node-gyp rebuild --arch=ia32` to build 32-bit version of plugin on 64-bit Windows

## Applications using mpv.js

* [boram](https://github.com/Kagami/boram)

## License

mpv.js is licensed under [CC0](COPYING) itself, however mpv.js + libmpv build is meant to be distributed as GPLv2+ due to mpv [being GPL](https://github.com/mpv-player/mpv/blob/master/LICENSE) and GPL dynamic linking restrictions.

It shouldn't affect entire Electron/NW.js app though because Chromium runs plugins inside separate process and GPL FAQ [doesn't restrict that](https://www.gnu.org/licenses/gpl-faq.html#NFUseGPLPlugins). (This is not a legal advice.)

Example video is part of Tears of Steel movie (CC) Blender Foundation | mango.blender.org.
