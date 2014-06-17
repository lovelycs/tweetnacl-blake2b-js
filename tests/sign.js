var nacl = require('../nacl.js');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

function csign(sk, msg, callback) {
  var hexsk = (new Buffer(sk)).toString('hex');
  var p = spawn('./csign', [hexsk]);
  var result = [];
  p.stdout.on('data', function(data) {
    result.push(data);
  });
  p.on('close', function(code) {
    var sigFromC = Buffer.concat(result).toString('base64');
    return callback(sigFromC);
  });
  p.on('error', function(err) {
    throw err;
  });
  p.stdin.write(msg);
  p.stdin.end();
}

function check(i, sk, pk) {
  var msg = nacl.randomBytes(i);
  //var msg = new Array(i).join('x');
  //console.log("\nTest #" + i + " (Message length: " + msg.length + ")");
  var sig = nacl.util.encodeBase64(nacl.sign(msg, sk));
  csign(sk, new Buffer(msg), function(sigFromC) {
    if (sigFromC != sig) {
      console.error("! signatures don't match\nJS: ", sig, "\nC : ", sigFromC);
      process.exit(1);
    } else {
      //console.log("sign - OK");
      process.stdout.write('.');
    }
    if (nacl.sign.open(nacl.util.decodeBase64(msg), nacl.util.decodeBase64(sigFromC), pk) === false) {
      console.log("! verification failed");
      process.exit(1);
    } else {
      //console.log("open - OK");
      process.stdout.write('.');
    }
    if (i == 100) { return; }
    check(i+1, sk, pk);
  });
}

var sk = [], pk = [];
nacl.lowlevel.crypto_sign_keypair(pk, sk);
check(0, sk, pk);
