const {components,Cc,Ci} = require("chrome");
const timer = require("timer");
const path = require("path");

exports.readlink = function (path, callback) {
  try {
    let link = exports.readlinkSync(path);
    if (callback)
      timer.setTimeout(callback, 0, null, link);
  } catch(e) {
    callback(e, null);
  }
}

exports.readlinkSync = function (path) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(path);
  } catch(e) {
    throw new Error("This path is not valid : "+path+"\n"+e);
  }
  if (!file.exists())
    return null;
  if (!file.isSymlink())
    return null;
  return file.target;
}

exports.stat = function (path, callback) {
  try {
    let stat = exports.statSync(path);
    if (callback)
      timer.setTimeout(callback, 0, null, stat);
  } catch(e) {
    callback(e, null);
  }
}
 
exports.statSync = function (path) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(path);
  } catch(e) {
    throw new Error("This path is not valid : "+path+"\n"+e);
  }
  if (!file.exists())
    return null;
  
  return {
    size: file.fileSize,
    isFile: function () {
      return file.isFile();
    },
    isDirectory: function () {
      return file.isDirectory();
    },
    isSymbolicLink: function () {
      return file.isSymlink();
    }
  };
}

exports.readdir = function (path, callback) {
  try {
    let files = exports.readdirSync(path);
    if (callback)
      timer.setTimeout(callback, 0, null, files);
  } catch(e) {
    callback(e, null);
  }
}

exports.readdirSync = function (path) {
  var dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    dir.initWithPath(path);
  } catch(e) {
    throw new Error("This directory path is not valid : "+path+"\n"+e);
  }
  if (!dir.exists())
    throw new Error("This directory doesn't exists : "+path);
  if (!dir.isDirectory())
    throw new Error("This is not a directory : "+path);
  let entries = dir.directoryEntries;
  let array = [];
  while(entries.hasMoreElements()) {
    let entry = entries.getNext();
    entry.QueryInterface(Ci.nsIFile);
    if (entry.leafName=="." || entry.leafName=="..") continue;
    array.push(entry.leafName);
  }
  return array;
}

function openRegularFile(path, mustExists) {
  let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(path);
  } catch(e) {
    throw new Error("This file path is not valid : "+path+"\n"+e);
  }
  if (mustExists && !file.exists())
    throw new Error("This file doesn't exists : "+path);
  if (file.exists() && !file.isFile())
    throw new Error("This is not a regular file : "+path);
  return file;
}

exports.readFileSync = function (path, encoding) {
  let file = openRegularFile(path, true);
  let fileContents = "";
  let fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                createInstance(Ci.nsIFileInputStream);
  fstream.init(file, -1, 0, 0);
  
  let charset = "UTF-8";  
  let replacementChar = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;  
  let is = Cc["@mozilla.org/intl/converter-input-stream;1"]  
           .createInstance(Ci.nsIConverterInputStream);  
  is.init(fstream, charset, 1024, replacementChar);
  
  let str = {};  
  while (is.readString(4096, str) != 0) {  
    fileContents += str.value;
  }  
  
  fstream.close();
  if (encoding=="ascii")
    return fileContents;
  else if (encoding=="utf8")
    return fileContents;
  else if (encoding=="base64")
    return atob(fileContents);
  else if (encoding)
    throw new Error("Unsupported encoding : "+encoding);
  return fileContents;
}

exports.readFile = function (path, encoding, callback) {
  try {
    timer.setTimeout(callback, 0, null, exports.readFileSync(path,encoding));
  } catch(e) {
    callback(e,null);
  }
}

exports.writeFileSync = function (path, data, encoding) {
  let file = openRegularFile(path, false);
  
  let charset = "UTF-8"; // Can be any character encoding name that Mozilla supports

  let fos = Cc["@mozilla.org/network/file-output-stream;1"].
            createInstance(Ci.nsIFileOutputStream);
  // use 0x02 | 0x10 to open file for appending.
  fos.init(file, 0x04 | 0x08 | 0x20, 0666, 0);
  
  let os = Cc["@mozilla.org/intl/converter-output-stream;1"].
           createInstance(Ci.nsIConverterOutputStream);
  
  // This assumes that fos is the template.Interface("nsIOutputStream") you want to write to
  os.init(fos, charset, 0, 0x0000);

  if (encoding=="ascii")
    ;
  else if (encoding=="utf8")
    ;
  else if (encoding=="base64")
    data = btoa(data);
  else if (encoding)
    throw new Error("Unsupported encoding : "+encoding);
  os.writeString(data);
  
  os.close();
}

exports.writeFile = function (path, data, encoding, callback) {
  try {
    exports.writeFileSync(path, data, encoding);
    if (callback)
      timer.setTimeout(callback,0);
  } catch(e) {
    if (callback)
      callback(e);
  }
}

exports.unlink = function (path, callback) {
  try {
    exports.unlinkSync(path);
    if (callback)
      timer.setTimeout(callback,0);
  } catch(e) {
    callback(e);
  }
}

exports.unlinkSync = function (path, mode) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(path);
  } catch(e) {
    throw new Error("This file path is not valid : "+path+"\n"+e);
  }
  if (file.exists())
    file.remove(false);
}

exports.rmdir = function (path, callback) {
  try {
    exports.rmdirSync(path);
    if (callback)
      timer.setTimeout(callback,0);
  } catch(e) {
    if (callback)
      callback(e);
  }
}

exports.rmdirSync = function (path, mode) {
  var dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    dir.initWithPath(path);
  } catch(e) {
    throw new Error("This directory path is not valid : "+path+"\n"+e);
  }
  if (!dir.exists())
    throw new Error("This directory does'nt exists : "+path);
  try {
    dir.remove(false);
  } catch(e) {
    throw new Error("Unable to remove this directory : "+path+"\n"+e);
  }
}

exports.mkdir = function (path, mode, callback) {
  exports.mkdirSync(path, mode);
  if (callback)
    timer.setTimeout(callback,0);
}

exports.mkdirSync = function (path, mode) {
  let dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    dir.initWithPath(path);
  } catch(e) {
    throw new Error("This directory path is not valid : "+path+"\n"+e);
  }
  if (dir.exists())
    throw new Error("This directory does already exists : "+path);
  dir.create(Ci.nsIFile.DIRECTORY_TYPE, mode || 0777);
}


exports.rename = function (path, newPath, callback) {
  exports.renameSync(path, newPath);
  if (callback)
    timer.setTimeout(callback,0);
}

exports.renameSync = function (oldPath, newPath) {
  let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    file.initWithPath(oldPath);
  } catch(e) {
    throw new Error("The source path is not valid : "+oldPath+"\n"+e);
  }
  if (!file.exists())
    throw new Error("The source file doesn't exists : "+oldPath);
  let destDirPath = path.dirname(newPath);
  let destFilename = path.basename(newPath);
  let destFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  try {
    destFile.initWithPath(newPath);
  } catch(e) {
    throw new Error("The destination path is not valid : "+destDirPath+"\n"+e);
  }
  let destDir = destFile.parent;
  if (!destDir.exists())
    throw new Error("The destination directory doesn't exists : " + destDirPath);
  else if (!destDir.isDirectory())
    throw new Error("Unable to get parent destination directory : " + destDirPath);
  else if (destFile.exists())
    throw new Error("The destination file already exists : " + newPath);
  file.moveTo(destDir, destFilename);
}
