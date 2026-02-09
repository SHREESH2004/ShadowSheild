import http from "http";

const URL = "http://localhost:3000/api/data";
const TOTAL_REQUESTS = 1000;

function sendRequest(i) {
    return new Promise((resolve) => {
        http.get(URL, (res) => {
            res.on("data", () => { });
            res.on("end", () => {
                resolve();
            });
        }).on("error", () => resolve());
    });
}

async function attack() {
    console.log(`🚀 Sending ${TOTAL_REQUESTS} requests...`);

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        await sendRequest(i);
    }

    console.log("✅ Done");
}

attack();