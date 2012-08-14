var config = module.exports;

config["joap"] = {
  environment: "browser",
  specs: ["spec/*.spec.coffee"],
  specHelpers: ["spec/browserSetup.coffee"],
  sources: ["strophe.joap.js"],
  libs: [
    "lib/jquery.js",
    "lib/strophe.js",
    "lib/strophe.rpc.js",
    "lib/jid.js" ],
  extensions: [require("buster-coffee")],
};
