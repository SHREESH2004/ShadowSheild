const BASE_URL = "http://localhost:3000";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const botAttack = async () => {
    console.log("🤖 Bot attack simulation started...\n");
    let blocked = false;
    for (let i = 1; i <= 200; i++) {
        try {
            const res = await fetch(`${BASE_URL}/download/sample.txt`);
            if (res.status === 429) {
                console.log(`🚨 Request ${i} | BLOCKED by ShadowShield | status: 429`);
                blocked = true;
                break;
            }
            console.log(`🤖 Request ${i} | /api/sample.txt | status: ${res.status}`);
        }
        catch (err) {
            console.log(`❌ Request ${i} failed — server may have dropped connection`);
            blocked = true;
            break;
        }
        await sleep(300);
    }
    if (blocked) {
        console.log("\n🚨 Bot was DETECTED and BLOCKED by ShadowShield");
    }
    else {
        console.log("\n⚠️  Bot completed without being blocked — lower thresholds");
    }
};
botAttack();
export {};
//# sourceMappingURL=attack.js.map