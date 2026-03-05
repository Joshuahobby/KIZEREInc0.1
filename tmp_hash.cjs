const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);

async function generateHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const buf = await scrypt(password, salt, 64);
    console.log(`${buf.toString("hex")}.${salt}`);
}

generateHash('admin123');
