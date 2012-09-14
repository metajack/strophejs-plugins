var config = module.exports;

config["joap"] = {
  environment: "browser",
  specs: ["spec/strophe.joap.spec.coffee"],
  specHelpers: ["spec/browserSetup.coffee"],
  sources: ["strophe.joap.js"],
  libs: [
    "lib/punycode.js",
    "jid.js",
    "lib/jquery.js",
    "lib/strophe.js",
    "lib/strophe.rpc.js" ],
  extensions: [require("buster-coffee")],
};

config["jid"] = {
  environment: "browser",
  specs: ["spec/jid.spec.coffee"],
  sources: ["jid.js"],
  libs: ["lib/punycode.js"],
  extensions: [require("buster-coffee")],
};
