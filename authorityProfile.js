import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVbhyE93T-JozS8Sc_CTkXDPCd48diJFE",
    authDomain: "meow-6b207.firebaseapp.com",
    databaseURL: "https://meow-6b207-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "meow-6b207",
    storageBucket: "meow-6b207.appspot.com",
    messagingSenderId: "87726449777",
    appId: "1:87726449777:web:9099fe2297e9683daca7d0",
    measurementId: "G-11RYQ8RR7P"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function fetchProfileData() {
    try {
        const dataRef = ref(db);
        const snapshot = await get(dataRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            displayData(data);
            compareCurrents(data.C1.Current, data.P1.Current); // Compare C1 and P1 currents
            compareP2Current(data.P2.Current, data.P1.Current, data.C2.Current); // Compare P2 with P1 + C2
            compareP3Current(data.P3.Current, data.C3.Current, data.P2.Current); // Compare P3 with C3 + P2
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function displayData(data) {
    const deviceDataSection = document.getElementById("device-data");

    // Main Data Card
    const mainData = document.createElement("div");
    mainData.classList.add("device");
    mainData.innerHTML = `
        <h2>Main</h2>
        <p>Current: ${data.MAIN.Current}</p>
        <p>Energy: ${data.MAIN.Energy}</p>
        <p>Power: ${data.MAIN.Power}</p>
        <p>Voltage: ${data.MAIN.Voltage}</p>
    `;
    deviceDataSection.appendChild(mainData);

    // Device Data Cards for C1, C2, C3, P1, P2, P3
    ["C1", "C2", "C3", "P1", "P2", "P3"].forEach((key) => {
                const deviceData = document.createElement("div");
                deviceData.classList.add("device");
                deviceData.innerHTML = `
            <h2>${key}</h2>
            <p>Current: ${data[key].Current} ${key === "C1" ? `<span id="c1-status" class="status"></span>` : ""}</p>
            <p>Energy: ${data[key].Energy}</p>
            <p>Power: ${data[key].Power}</p>
            <p>Voltage: ${data[key].Voltage}</p>
            ${key === "C1" || key === "C2" || key === "C3" ? `
                <label>
                    Connection Status:
                    <input type="checkbox" id="connection-toggle-${key}" ${data[key].LED ? "checked" : ""}>
                </label>` : ""}
            ${key === "P1" ? `<p id="p1-status" class="status"></p>` : ""}
            ${key === "P2" ? `<p id="p2-status" class="status"></p>` : ""}
            ${key === "P3" ? `<p id="p3-status" class="status"></p>` : ""}
        `;
        deviceDataSection.appendChild(deviceData);

        // Add event listener for Connection Status toggle if applicable
        if (key === "C1" || key === "C2" || key === "C3") {
            const connectionToggle = document.getElementById(`connection-toggle-${key}`);
            connectionToggle.checked = data[key].LED; // Set initial state based on Firebase
            connectionToggle.addEventListener("change", (event) => {
                updateConnectionStatus(key, event.target.checked);
            });
        }
    });
}

// Function to compare C1 and P1 currents with 2% error margin and 0.09 amp tolerance
function compareCurrents(c1Current, p1Current) {
    const errorMargin = 0.02; // 2% error
    const difference = Math.abs(c1Current - p1Current);
    const allowableDifference = c1Current * errorMargin;
    const tolerance = 0.1; // 0.09 amp tolerance

    const c1StatusElement = document.getElementById("c1-status");
    const p1StatusElement = document.getElementById("p1-status");

    if (difference <= tolerance) {
        // Ignore small differences within the 0.09 amp range
        c1StatusElement.innerHTML = `<span class="ok"></span>`;
        p1StatusElement.innerHTML = `<span class="ok">Difference too small to detect</span>`;
    } else if (difference > allowableDifference) {
        c1StatusElement.innerHTML = `<span class="not-ok"></span>`;
        p1StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;
    } else {
        c1StatusElement.innerHTML = `<span class="ok"></span>`;
        p1StatusElement.innerHTML = `<span class="ok">All OK in P1 region</span>`;
    }
}

// Function to compare P2 current with the sum of P1 and C2 currents with 2% error margin and 0.09 amp tolerance
function compareP2Current(p2Current, p1Current, c2Current) {
    const errorMargin = 0.02; // 2% error
    const expectedCurrent = p1Current + c2Current;
    const difference = Math.abs(p2Current - expectedCurrent);
    const allowableDifference = expectedCurrent * errorMargin;
    const tolerance = 0.1; // 0.09 amp tolerance

    const p2StatusElement = document.getElementById("p2-status");

    if (difference <= tolerance) {
        // Ignore small differences within the 0.09 amp range
        p2StatusElement.innerHTML = `<span class="ok">Difference too small to detect</span>`;
    } else if (difference <= allowableDifference) {
        p2StatusElement.innerHTML = `<span class="ok">All OK IN P2 Region</span>`;
    } else {
        p2StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;
    }
}

// Function to compare P3 current with the sum of C3 and P2 currents with 2% error margin and 0.09 amp tolerance
function compareP3Current(p3Current, c3Current, p2Current) {
    const errorMargin = 0.02; // 2% error
    const expectedCurrent = c3Current + p2Current;
    const difference = Math.abs(p3Current - expectedCurrent);
    const allowableDifference = expectedCurrent * errorMargin;
    const tolerance = 0.1; // 0.09 amp tolerance

    const p3StatusElement = document.getElementById("p3-status");

    if (difference <= tolerance) {
        // Ignore small differences within the 0.09 amp range
        p3StatusElement.innerHTML = `<span class="ok">Difference too small to detect</span>`;
    } else if (difference <= allowableDifference) {
        p3StatusElement.innerHTML = `<span class="ok">All OK IN P3 Region</span>`;
    } else {
        p3StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;
    }
}

async function updateConnectionStatus(device, status) {
    try {
        const deviceRef = ref(db, `${device}`);
        await update(deviceRef, { LED: status });
        console.log(`Updated Connection Status for ${device} to ${status}`);
    } catch (error) {
        console.error("Error updating Connection Status:", error);
    }
}

// Fetch and display data on page load
fetchProfileData();
