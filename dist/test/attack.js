const BASE_URL = "http://localhost:3000";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const botAttack = async () => {
    console.log("🤖 Bot attack simulation started...\n");
    let sessionCookie = "";
    let blocked = false;
    const fakeIPs = [
        "192.168.1.1",
        "192.168.1.2",
        "192.168.1.3",
        "192.168.1.4",
        "192.168.1.5",
    ];
    for (let i = 1; i <= 100; i++) {
        const fakeIP = fakeIPs[Math.floor(i / 5) % fakeIPs.length];
        try {
            const res = await fetch(`${BASE_URL}/api/sample.txt`, {
                headers: {
                    "X-Forwarded-For": fakeIP,
                    ...(sessionCookie ? { "Cookie": sessionCookie } : {})
                }
            });
            if (i === 1) {
                const setCookie = res.headers.get("set-cookie");
                if (setCookie) {
                    sessionCookie = setCookie.split(";")[0];
                    console.log(`🍪 Session cookie captured: ${sessionCookie}\n`);
                }
            }
            if (res.status === 429) {
                console.log(`Request ${i} | IP: ${fakeIP} | BLOCKED | status: 429`);
                blocked = true;
                break;
            }
            console.log(`Request ${i} | IP: ${fakeIP} | session: ${sessionCookie.slice(0, 20)}... | status: ${res.status}`);
        }
        catch (err) {
            console.log(` Request ${i} failed`);
            blocked = true;
            break;
        }
        await sleep(300);
    }
    if (blocked) {
        console.log("\n Bot DETECTED and BLOCKED by ShadowShield");
    }
    else {
        console.log("\n Bot completed — lower threshold or increase requests");
    }
};
botAttack();
export {};
//# sourceMappingURL=attack.js.map