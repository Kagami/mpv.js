<h1 align="center">
  <a href="https://mpv.io/">
    <img src="https://i.imgur.com/qQFg0aI.png" alt="mpv" width="200">
  </a>
  <br>mpv.js<br><br>
</h1>

<h4 align="center">
  All format embeddable player for Electron/NW.js applications.
  <br>Powered by marvelous <a href="https://mpv.io/">mpv</a>.
</h4>

<p align="center">
  <a href="https://travis-ci.org/Kagami/mpv.js">
    <img src="https://img.shields.io/travis/Kagami/mpv.js.svg" alt="Travis">
  </a>
  <a href="https://npmjs.org/package/mpv.js">
    <img src="https://img.shields.io/npm/v/mpv.js.svg" alt="NPM">
  </a>
</p>

## Get libmpv

In order to try mpv.js you need to install mpv library first.

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack, put corresponding `mpv-1.dll` to `C:\Windows\system32`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv1 libavformat-dev`

## Example

![](https://i.imgur.com/tLFkATs.png)

[Simple Electron application](example) yet capable of handling pretty much any available video thanks to mpv. Run:

```bash
git clone https://github.com/Kagami/mpv.js.git && cd mpv.js
npm install
# Only on Linux: npm run use-system-ffmpeg
npm run example
```

## Usage

### Add npm package

```bash
npm install mpv.js --save
```

Package includes prebuilt binaries for all major platforms so no need to setup compilers.

### Load plugin in main process (Electron example)

```javascript
const path = require("path");
const {app} = require("electron");
const {getPluginEntry} = require("mpv.js");

// Absolute path to the plugin directory.
const pluginDir = path.join(path.dirname(require.resolve("mpv.js")), "build", "Release");
// See pitfalls section for details.
if (process.platform !== "linux") {process.chdir(pluginDir);}
// Fix for latest Electron.
app.commandLine.appendSwitch("no-sandbox");
// To support a broader number of systems.
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("register-pepper-plugins", getPluginEntry(pluginDir));
```

Don't forget to enable `plugins` feature when creating `BrowserWindow`:

```javascript
const win = new BrowserWindow({
  // ...
  webPreferences: {plugins: true},
  // ...
});
```

### Use MPV component (React example)

```javascript
const React = require("react");
const {ReactMPV} = require("mpv.js");

class Player extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mpv = null;
    this.state = {pause: true, "time-pos": 0};
  }
  handleMPVReady(mpv) {
    this.mpv = mpv;
    this.mpv.observe("pause");
    this.mpv.observe("time-pos");
    this.mpv.command("loadfile", "/path/to/video.mkv");
  }
  handlePropertyChange(name, value) {
    this.setState({[name]: value});
  }
  togglePause() {
    this.mpv.property("pause", !this.state.pause);
  }
  render() {
    return (
      <ReactMPV
        className="player"
        onReady={this.handleMPVReady.bind(this)}
        onPropertyChange={this.handlePropertyChange.bind(this)}
        onMouseDown={this.togglePause.bind(this)}
      />
    );
  }
}
```

Currently only React component is provided.

### See also

* [mpv properties documentation](https://mpv.io/manual/master/#property-list)
* [mpv commands documentation](https://mpv.io/manual/master/#list-of-input-commands)
* [ReactMPV source](index.js) with JSDoc API comments
* [example player source](example/renderer.js) for a more advanced usage

## Packaging

Basically all you need to ship is `mpvjs.node` and mpv library. Make sure they both and also Electron/NW.js distribution have the same bitness!

### Windows

You may use [lachs0r builds](https://mpv.srsfckn.biz/mpv-dev-latest.7z). Copy `mpv-1.dll` to the directory with `mpvjs.node` and you are done.

### macOS

[Homebrew](https://brew.sh/) can compile `libmpv.1.dylib` and all its dependencies. To find dylibs that need to be packaged and fix install names you may use [collect-dylib-deps](scripts/collect-dylib-deps.sh) script.

### Linux

Two options are normally acceptable:

1. Ask your users to install `libmpv1` with package manager or simply depend on it if you build package.
2. Compile static `libmpv.so` with e.g. [mpv-build](https://github.com/mpv-player/mpv-build).

## Pitfalls

### Path to plugin can't contain non-ASCII symbols

This is unfortunate Chromium's [pepper_plugin_list.cc](https://chromium.googlesource.com/chromium/src/+/59.0.3036.3/content/common/pepper_plugin_list.cc#84) restriction. To workaround this relative path might be used.

On Windows and Mac it can be done by changing working directory to the path where `mpvjs.node` is stored. You can't change CWD of renderer process on Linux inside main process because of zygote architecture so another fix is just `cd` to the plugin directory in wrapper script.

`getPluginEntry` helper will give you plugin entry string with that fix applied.

### libmpv is being linked with Electron's libffmpeg on Linux

On Linux plugins loaded with `register-pepper-plugins` inherit symbols from `electron` binary so it leads to unfortunate effect: libmpv will use Electron's libraries which is not supported.

To workaround it you need to either replace `libffmpeg.so` with empty wrapper linked to `libav*`:

```bash
gcc -Wl,--no-as-needed -shared -lavformat -o /path/to/libffmpeg.so
```

Or use libmpv with statically linked `libav*`.

## Build on x86

To build `mpvjs.node` by yourself you need to setup dev environment.

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
3. Run `cd C:\nacl_sdk\pepper_49\src` and `make TOOLCHAIN=win PROJECTS="ppapi_cpp ppapi_gles2"`

### Step 3: setup mpv development files

* Windows: download [mpv-dev](https://mpv.srsfckn.biz/mpv-dev-latest.7z), unpack to `C:\mpv-dev`
* macOS: `brew install mpv`
* Linux: `apt-get install libmpv-dev`

### Step 4: build plugin

* Run `node-gyp rebuild` in project directory
* Run `node-gyp rebuild --arch=ia32` to build 32-bit version of plugin on 64-bit Windows

## Build on ARM

**Important:** Electron 1.8.x ARM releases are [broken](https://github.com/electron/electron/issues/12329) so use 2.x or 1.7.x instead.

**Note:** instructions below have been tested on Raspberry Pi 3, [see more](https://github.com/Kagami/mpv.js/issues/32).

### Step 0: enable hardware graphics acceleration

* Run `sudo raspi-config`
* Select **Advanced Options**, then select **GL Driver** and then **GL (Full KMS) OpenGL desktop driver with full KMS**. When configuration is finished you will see following message: "Full KMS GL driver is enabled"
* Select `<Ok>` and then `<Finish>` and raspi-config tool will ask you if you would like to reboot
* Select `<Yes>` to reboot the system and apply configuration changes

### Step 1: setup node-gyp

See [installation](https://github.com/nodejs/node-gyp#installation) section.

### Step 2: setup NaCl SDK

The NaCl SDK itself is [only built to run on x86](https://groups.google.com/forum/#!topic/native-client-discuss/yrtiu63iBQ4), so you can't use `./naclsdk`. Instead you have to download [pepper's archive](https://storage.googleapis.com/nativeclient-mirror/nacl/nacl_sdk/49.0.2623.87/naclsdk_linux.tar.bz2) directly and unpack it to some directory. Then add `export NACL_SDK_ROOT=/path/to/pepper_49` to `~/.bash_profile`.

### Step 3: setup mpv development files

`apt-get install libmpv-dev`

### Step 4: compile ARM host binaries

Run `cd /path/to/pepper_49/src` and `make TOOLCHAIN=linux PROJECTS="ppapi_cpp ppapi_gles2" CFLAGS="-D_GLIBCXX_USE_CXX11_ABI=0"`.

### Step 5: build plugin

After the process is done, head back to mpv.js directory and run `node-gyp rebuild`.

## Applications using mpv.js

* [boram](https://github.com/Kagami/boram)
* [Arclight](https://github.com/mchome/arclight)
* [BeyondPlayer](https://github.com/circleapps/beyondplayer)
* [Torrent Player](https://github.com/Andro999b/torrent-player)

Feel free to PR your own.

## License

mpv.js is licensed under [CC0](COPYING) itself. However if you use GPL build of libmpv (e.g. lachs0r builds) your application might violate GPL dynamic linking restrictions. LGPL build should be safe, see [mpv copyright](https://github.com/mpv-player/mpv/blob/master/Copyright) for details. (This is not a legal advice.)

Example video is part of Tears of Steel movie (CC) Blender Foundation | mango.blender.org.

Logo is by @SteveJobzniak.
