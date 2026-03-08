const BASE_URL = "http://localhost:3000";
const endpoints = [
    "/api/sample.txt",
    "/api/health",
    "/api/data",
    "/download/sample.txt",
];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const normalUser = async () => {
    console.log("Normal user simulation started...\n");
    for (let i = 1; i <= 20; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`);
            console.log(`✅ Request ${i} | ${endpoint} | status: ${res.status}`);
        }
        catch (err) {
            console.log(`❌ Request ${i} failed`);
        }
        const delay = randomBetween(1000, 4000);
        console.log(`   waiting ${delay}ms...\n`);
        await sleep(delay);
    }
    console.log("✅ Normal user simulation complete");
};
normalUser();
export {};
//# sourceMappingURL=normal.js.map