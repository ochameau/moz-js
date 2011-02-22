const path = require("path");
const fs = require("fs");
const self = require("self");

function getDataFilePath(file) {
  return require("url").toFilename(self.data.url(file));
}



exports.testReadDir = function (test) {
  let dir = getDataFilePath("test-fs/readdir");
  let array = fs.readDirSync(dir);
  test.assertEqual(array.length, 3);
  let validArray = ["a","b","c"];
  
  for(var i=0; i<validArray.length; i++) {
    let idx = array.indexOf(path.join(dir, validArray[i]));
    if (idx == -1) {
      test.fail("readDir didn't returned '"+validArray[i]+"'");
      break;
    }
    
    test.assert(path.existsSync(array[idx]));
    array.splice(idx, 1);
  }
  if (array.length > 0)
    test.fail("readdir returned unexpected files : "+array.join(', '));
}

exports.testReadFile = function (test) {
  let file = getDataFilePath("test-fs/readFile.txt");
  test.assertEqual(fs.readFileSync(file,"utf8"),"file\ncontent\ntest\nutfë8");
  test.waitUntilDone();
  fs.readFile(file,"utf8", function (err, data) {
      test.assertEqual(data,"file\ncontent\ntest\nutfë8");
      test.done();
    });
}

exports.testWriteFile = function (test) {
  let file = getDataFilePath("test-fs/writeFile.txt");
  fs.writeFileSync(file,"file\ncontent\ntest\nutfë8","utf8");
  test.assertEqual(fs.readFileSync(file,"utf8"),"file\ncontent\ntest\nutfë8");
  test.waitUntilDone();
  fs.writeFile(file,"file\ncontent\ntest\nutfë8\n2","utf8", function (err) {
      test.assertEqual(fs.readFileSync(file,"utf8"),"file\ncontent\ntest\nutfë8\n2");
      test.done();
    });
  
}
