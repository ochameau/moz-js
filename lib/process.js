let {Cc,Ci,Cu} = require("chrome");

exports.__defineGetter__("argv", function() {
  let argv = [];
  
  let xpcomClass = Cc["@mozilla.org/commandlinehandler/general-startup;1?type=m-jetpack-clh"];
  if (xpcomClass) {
    // We have the command line handler XPCOM
    // ie we are running as a xulrunner application
    let xpcomComponent = xpcomClass.getService();
    if (xpcomComponent.wrappedJSObject)
      xpcomComponent = xpcomComponent.wrappedJSObject;
    let cmdLine = xpcomComponent.lastCommand;
    
    for(let i=0; i<cmdLine.length; i++) {
      argv.push(cmdLine.getArgument(i));
    }
  } else {
    // We don't have this xpcom, so we may be in a firefox extension
    // As we use bootstrapped extension, we can't load any xpcom at startup
    // So try to grab command line arguments from OS libraries
    // As we have no way to access nsICommandLine
    let ctypes = Cu.import("resource://gre/modules/ctypes.jsm").ctypes;
    try {
      // Win32 implementation:
      let libkernel = ctypes.open("kernel32.dll");
      let libshell = ctypes.open("shell32.dll");
      // LPTSTR WINAPI GetCommandLine(void);
      let GetCommandLineW = libkernel.declare( "GetCommandLineW", ctypes.winapi_abi, ctypes.jschar.ptr );
      // LPWSTR* CommandLineToArgvW( __in   LPCWSTR lpCmdLine, __out  int *pNumArgs );
      let CommandLineToArgvW = libshell.declare( "CommandLineToArgvW", ctypes.winapi_abi, ctypes.jschar.ptr.array(100).ptr, ctypes.jschar.ptr, ctypes.int.ptr );
      let length = ctypes.int(0);
      let array = CommandLineToArgvW(GetCommandLineW(),length.address());
      array = ctypes.cast(array.contents,ctypes.jschar.ptr.array(length.value));
      
      for(var i=0; i<length.value; i++) {
        argv.push(array[i].readString());
      }
    } catch(e) {console.log("exception :"+e);}
  }
  this.argv = argv;
  return argv;
});

exports.exit = function exit(code) {
  let appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
                 .getService(Ci.nsIAppStartup);
  appStartup.quit(Ci.nsIAppStartup.eAttemptQuit);
  //or Ci.nsIAppStartup.eForceQuit for a brutal force quit.
}

exports.cwd = function cwd() {
  return Cc["@mozilla.org/file/directory_service;1"].
          getService(Ci.nsIDirectoryServiceProvider).
          getFile("CurWorkD",{}).path;
}

let envService = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
exports.env = Proxy.create({
  get: function(proxy, name) {
    return envService.get(name);
  },
  set: function(proxy, name, value) {
    return envService.set(name,value);
  }
});
