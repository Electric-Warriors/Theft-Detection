import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, get, update} from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

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


let mismatchTimeout;
let mismatchDetected = false;

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
            compareP3WithMain(data.MAIN.Current, data.P3.Current ); // Compare P3 with MAIN current
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
    mainData.innerHTML =
        `<h2>Main</h2>
        <p>Current: ${data.MAIN.Current}</p>
        <p>Energy: ${data.MAIN.Energy}</p>
        <p>Power: ${data.MAIN.Power}</p>
        <p>Voltage: ${data.MAIN.Voltage}</p>
        <p id="main-status" class="status"></p>`; // Added for MAIN status
       deviceDataSection.appendChild(mainData);

    // Device Data Cards for C1, C2, C3, P1, P2, P3
    ["C1", "C2", "C3", "P1", "P2", "P3"].forEach((key) => {
                const deviceData = document.createElement("div");
                deviceData.classList.add("device");
                deviceData.innerHTML =
                    `<h2>${key}</h2>
            <p>Current: ${data[key].Current} ${key === "C1" ? `<span id="c1-status" class="status"></span>` : ""}</p>
            <p>Energy: ${data[key].Energy}</p>
            <p>Power: ${data[key].Power}</p>
            <p>Voltage: ${data[key].Voltage}</p>
            ${key === "C1" || key === "C2" || key === "C3" ? 
                `<label>
                    Connection Status:
                    <input type="checkbox" id="connection-toggle-${key}" ${data[key].LED ? "checked" : ""}>
                </label>` : ""}
            ${key === "P1" ? `<p id="p1-status" class="status"></p>` : ""}
            ${key === "P2" ? `<p id="p2-status" class="status"></p>` : ""}
            ${key === "P3" ? `<p id="p3-status" class="status"></p>` : ""}`;
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

        if (mismatchDetected) {
            clearTimeout(mismatchTimeout);
            mismatchDetected = false;
            updateWarningField("C1", false); // Reset warning when mismatch is cleared
        }
    } else if (difference > allowableDifference) {
        c1StatusElement.innerHTML = `<span class="not-ok"></span>`;
        p1StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;

        if (!mismatchDetected) {
            mismatchDetected = true;
            updateWarningField("C1", true); // Set Warning to true when mismatch occurs

            // If mismatch persists for 1 minute, set LED to false
            mismatchTimeout = setTimeout(() => {
                if (mismatchDetected) {
                    updateConnectionStatus("C1", false); // Set LED to false after 1 minute if mismatch not fixed
                }
            }, 60000); // 1 minute timeout
        }
    } else {
        c1StatusElement.innerHTML = `<span class="ok"></span>`;
        p1StatusElement.innerHTML = `<span class="ok">All OK in P1 region</span>`;
    }
}

// Function to update the Warning field in Firebase
async function updateWarningField(device, status) {
    try {
        const deviceRef = ref(db, `${device}`);
        await update(deviceRef, { Warning: status });
        console.log(`Updated Warning Status for ${device} to ${status}`);
    } catch (error) {
        console.error("Error updating Warning Status:", error);
    }
}

// Function to update the Connection Status (LED) in Firebase
async function updateConnectionStatus(device, status) {
    try {
        const deviceRef = ref(db, `${device}`);
        await update(deviceRef, { LED: status });
        console.log(`Updated Connection Status for ${device} to ${status}`);
    } catch (error) {
        console.error("Error updating Connection Status:", error);
    }
}

// Function to compare P2 current with the sum of P1 and C2 currents with 2% error margin and 0.09 amp tolerance
async function compareP2Current(p2Current, p1Current, c2Current) {
    const errorMargin = 0.02; // 2% error
    const tolerance = 0.05; // 0.09 amp tolerance
    const expectedCurrent = p1Current + c2Current;
    const difference = Math.abs(p2Current - expectedCurrent);
    const allowableDifference = expectedCurrent * errorMargin;

    const p2StatusElement = document.getElementById("p2-status");

    if (difference <= tolerance) {
        // Ignore small differences within the 0.09 amp range
        p2StatusElement.innerHTML = `<span class="ok">Difference too small to detect</span>`;
    } else if (difference <= allowableDifference) {
        p2StatusElement.innerHTML = `<span class="ok">All OK in P2 Region</span>`;
    } else {
        p2StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;
        
        // Mismatch detected, set LED of C2 to false for 15 seconds
        const c2Ref = ref(db, 'C2');
        await update(c2Ref, { LED: false });
        console.log("LED of C2 set to false for 15 seconds");

        setTimeout(async () => {
            // Fetch real-time values from the database for P1 and P2 before rechecking
            const p1Snapshot = await get(ref(db, 'P1'));
            const p2Snapshot = await get(ref(db, 'P2'));
            const p1RealTimeCurrent = p1Snapshot.exists() ? p1Snapshot.val().Current : 0;
            const p2RealTimeCurrent = p2Snapshot.exists() ? p2Snapshot.val().Current : 0;

            // Assume C2 current is 0 for the second comparison (theft detection)
            const expectedCurrentWithZeroC2 = p1RealTimeCurrent; // Assume C2 is 0
            const differenceWithZeroC2 = Math.abs(p2RealTimeCurrent - expectedCurrentWithZeroC2);

            if (differenceWithZeroC2 > tolerance) {
                // Theft detected between P1 and P2
                p2StatusElement.innerHTML = `<span class="not-ok">Theft detected between P1 and P2</span>`;
                console.log("Theft detected between P1 and P2");

                // Set LED of C2 back to true since it's not C2's fault
                await update(c2Ref, { LED: true });
                console.log("LED of C2 set to true because it's not C2's fault");

                // Stop comparison for 5 minutes and show theft message
                setTimeout(() => {
                    p2StatusElement.innerHTML = `<span class="not-ok">Theft between P1 and P2</span>`;
                    console.log("Comparison stopped for 5 minutes due to confirmed theft");
                }, 5000); // Keep showing the theft message for 5 minutes

            } else {
                // No theft detected, it's a consumer fault
                p2StatusElement.innerHTML = `<span class="ok">Fault in consumer line detected</span>`;
                console.log("Fault detected in consumer line");

                // After 15 seconds, set LED of C2 back to true and set Warning field
                await update(c2Ref, { LED: true, Warning: true });
                console.log("LED of C2 set back to true and Warning set to true");

                // Wait for 1 minute before rechecking with real-time data
                setTimeout(async () => {
                    const p1Snapshot = await get(ref(db, 'P1'));
                    const c2Snapshot = await get(ref(db, 'C2'));
                    const p1RealTimeCurrent = p1Snapshot.exists() ? p1Snapshot.val().Current : 0;
                    const c2RealTimeCurrent = c2Snapshot.exists() ? c2Snapshot.val().Current : 0;

                    const newExpectedCurrent = p1RealTimeCurrent + c2RealTimeCurrent;
                    const newDifference = Math.abs(p2RealTimeCurrent - newExpectedCurrent);

                    if (newDifference > allowableDifference) {
                        // Still mismatch, mark consumer fault
                        await update(c2Ref, { LED: false });
                        console.log("Consumer fault detected, LED of C2 set to false");
                    } else {
                        // No fault, reset Warning
                        await update(c2Ref, { Warning: false });
                        console.log("No fault detected, Warning reset");
                    }
                }, 60000); // Check again after 1 minute
            }
        }, 10000); // Recheck after 10 seconds assuming C2's current is zero
    }
}


// Function to compare P3 current with the sum of C3 and P2 currents with 2% error margin and 0.09 amp tolerance
async function compareP3Current(p3Current, c3Current, p2Current) {
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
        p3StatusElement.innerHTML = `<span class="ok">All OK in P3 Region</span>`;
    } else {
        p3StatusElement.innerHTML = `<span class="not-ok">Mismatch</span>`;
        
        // Mismatch detected, set LED of C3 to false for 15 seconds
        const c3Ref = ref(db, 'C3');
        await update(c3Ref, { LED: false });
        console.log("LED of C3 set to false for 15 seconds");

        setTimeout(async () => {
            // After 10 seconds, assume C3 current is zero and check again
            const expectedCurrentWithZeroC3 = p2Current;
            const differenceWithZeroC3 = Math.abs(p3Current - expectedCurrentWithZeroC3);
            if (differenceWithZeroC3 > tolerance) {
                // Theft detected between P3 and P2
                p3StatusElement.innerHTML = `<span class="not-ok">Theft detected between P3 and P2</span>`;
                console.log("Theft detected between P3 and P2");

                // Set LED of C3 back to true since it's not C3's fault
                await update(c3Ref, { LED: true });
                console.log("LED of C3 set to true because it's not C3's fault");

                // Stop comparison for 5 minutes and show theft message
                setTimeout(() => {
                    p3StatusElement.innerHTML = `<span class="not-ok">Theft between P3 and P2</span>`;
                    console.log("Comparison stopped for 5 minutes due to confirmed theft");
                }, 5000); // Keep showing the theft message for 5 minutes

            } else {
                // No theft detected, it's a consumer fault
                p3StatusElement.innerHTML = `<span class="ok">Fault in consumer line detected</span>`;
                console.log("Fault detected in consumer line");

                // After 15 seconds, set LED of C3 back to true and set Warning field
                await update(c3Ref, { LED: true, Warning: true });
                console.log("LED of C3 set back to true and Warning set to true");

                // Wait for 1 minute before rechecking
                setTimeout(async () => {
                    const newDifference = Math.abs(p3Current - expectedCurrent);
                    if (newDifference > allowableDifference) {
                        // Still mismatch, mark consumer fault
                        await update(c3Ref, { LED: false });
                        console.log("Consumer fault detected, LED of C3 set to false");
                    } else {
                        // No fault, reset Warning
                        await update(c3Ref, { Warning: false });
                        console.log("No fault detected, Warning reset");
                    }
                }, 60000); // Check again after 1 minute
            }
        }, 10000); // Recheck after 10 seconds assuming C3's current is zero
    }
}
function compareP3WithMain(p3Current, mainCurrent) {
    const errorMargin = 0.02; // 2% error margin
    const tolerance = 0.09; // 0.09 amp tolerance
    const difference = Math.abs(p3Current - mainCurrent);
    const allowableDifference = mainCurrent * errorMargin;

   
    const mainStatusElement = document.getElementById("main-status");

    if (difference <= tolerance) {
        // Ignore small differences within the 0.09 amp range
       mainStatusElement.innerHTML = `<span class="ok">Difference too small to detect</span>`;
    } else if (difference <= allowableDifference) {
        // Differences within acceptable error margin
          mainStatusElement.innerHTML = `<span class="ok">All OK in Main Region</span>`;
    } else {
        // Significant mismatch detected
        mainStatusElement.innerHTML = `<span class="not-ok">Theft detected between MAIN and P3</span>`;
        console.log("Theft detected: Significant mismatch between MAIN and P3 current.");
    }
}

// Fetch and display data on page load
fetchProfileData();
