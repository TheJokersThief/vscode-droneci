# DroneCI

## Features

View your build feed from VSCode.

 - Build feed in sidebar views
 - View build log status
 - View step log in vscode

<p align="center">
  <img src="https://raw.githubusercontent.com/jigkoxsee/vscode-droneci/master/images/buildfeed.png" alt="Build feed screenshot" />
</p>

## Extension Settings

This extension contributes the following settings:

* `drone.server`: Drone's server url
* `drone.token`: Drone's personal token


-----------------------------------------------------------------------------------------------------------

**Enjoy!**

# Installing from source:

Install vsce:

Make sure you have Node.js installed. Then run:

```
npm install -g vsce yarn
```

Check out the GitHub repo/branch you want.

Depending on the project, you may need to install its dependencies (npm install or whatever package manager you use). Some can be packaged without dependencies.

Run the following in the root of the project (see the official docs for more detail about the process):

```
vsce package  # Generates a .vsix file
code --install-extension droneci-0.0.11.vsix
```