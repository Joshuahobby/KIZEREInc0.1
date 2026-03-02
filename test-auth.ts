import { comparePasswords } from "./server/utils/auth-crypto";

async function testPassword() {
    const hash = "bcf67618b2dc12cc0ceada4807a8c46d1de381976481f2806ff40068725db79231c804fde5071c907909dff5ff14abf7bc3dbabac88c271ee613a50c2e6688267.e21aacf975da8507d251d8474b93af98";
    const password = "Test@123";

    console.log("Comparing password...");
    try {
        const match = await comparePasswords(password, hash);
        console.log("MATCH_RESULT:" + match);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
    process.exit(0);
}

testPassword();
