let {components,Cc,Ci} = require("chrome");

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
    isDirectory : function () {
      return file.isDirectory();
    }
  };
}


exports.readDirSync = function (path) {
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
    array.push(entry.path);
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
    callback(null,exports.readFileSync(path,encoding));
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
    callback(null);
  } catch(e) {
    callback(e);
  }
}
