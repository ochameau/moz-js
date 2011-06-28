const process = require("process");
const path = require("path");
const self = require("self");

exports.testCWD = function (test) {
  let selfPath = path.join(require("url").toFilename(self.data.url("")), "..");
  let cwd = process.cwd();
  test.assertEqual(selfPath, cwd);
}

exports.testENV = function (test) {
  test.assert(process.env.PATH);
  test.assert(process.env.CUDDLEFISH_ROOT);
  test.assert(!process.env.NON_EXISTANT_VAR_1245);
}
