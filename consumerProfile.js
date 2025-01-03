// Your web app's Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', function() {
    const userDetails = document.getElementById('userDetails');
    const consumerDataTable = document.getElementById('consumerData');
    const logoutButton = document.getElementById('logoutButton');
    const historicalDataTable = document.getElementById('historicalData'); // Ensure this ID matches your HTML
    const ctx = document.getElementById('realTimeDataChart').getContext('2d');
    const historicalChartCtx = document.getElementById('historicalDataChart').getContext('2d');

    // Firebase references
    const auth = firebase.auth();
    const database = firebase.database();

    // Google Sheets URLs based on authkey
    const sheetUrls = {
        C1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=0&single=true&output=csv",
        C2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=117341082&single=true&output=csv",
        C3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=1658560759&single=true&output=csv",
        P1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=1066763191&single=true&output=csv",
        P2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=1709578150&single=true&output=csv",
        P3: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=604018358&single=true&output=csv",
        MAIN: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCHS9SLQWZIW7DA_az30K9WQqwX4YmtOvntPosMmP2lkAfYPFvlqefTxs4UYf7OQyhR9jNBb8kEN3/pub?gid=1621482212&single=true&output=csv"
    };

    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // Get user data from database
            database.ref('users/' + user.uid).once('value')
                .then(snapshot => {
                    const userData = snapshot.val();
                    if (userData) {
                        userDetails.innerHTML =
                            `<h2>Profile Information</h2>
                            <p>Name: ${userData.name}</p>
                            <p>Email: ${userData.email}</p>
                            <p>Phone: ${userData.phone}</p>`;

                        // Fetch real-time data from Firebase
                        fetchRealTimeData(userData.authkey.toUpperCase());

                        // Fetch historical data from Google Sheets based on authkey
                        fetchHistoricalData(userData.authkey.toUpperCase());
                    }
                })
                .catch(error => {
                    console.error("Error fetching user data:", error);
                    userDetails.innerHTML = "<p>Error fetching user data.</p>";
                });
        } else {
            // Redirect to login page if not logged in
            window.location.href = 'login.html';
        }
    });

    // Function to fetch real-time data from Firebase
    function fetchRealTimeData(authKey) {
        database.ref(authKey).on('value', (snapshot) => {
            const consumerData = snapshot.val();
            if (consumerData) {
                // Populate consumer data table with real-time data
                consumerDataTable.innerHTML = `
                    <tr><td>Current</td><td>${consumerData.Current} A</td></tr>
                    <tr><td>Voltage</td><td>${consumerData.Voltage} V</td></tr>
                    <tr><td>Power</td><td>${consumerData.Power} W</td></tr>
                    <tr><td>Power Factor</td><td>${consumerData.PF}</td></tr>
                    <tr><td>Energy</td><td>${consumerData.Energy} kWh</td></tr>
                    <tr><td>LED Status</td><td>${consumerData.LED ? "On" : "Off"}</td></tr>
                `;
                 // Check Warning status and update warning field visibility
                const warningField = document.getElementById('warningField');
                if (consumerData.Warning) {
                    warningField.style.display = 'block'; // Show warning field
                } else {
                    warningField.style.display = 'none'; // Hide warning field
                }
                // Update real-time chart
                updateRealTimeChart(consumerData);
            }
        });
    }


    // Function to fetch historical data from Google Sheets based on authkey
    function fetchHistoricalData(authKey) {
        const sheetUrl = sheetUrls[authKey];
        if (!sheetUrl) {
            console.error("Invalid authkey:", authKey);
            return;
        }

        fetch(sheetUrl)
            .then(response => response.text())
            .then(csvText => {
                const data = csvToArray(csvText);
                if (data.length > 0) {
                    // Call the function to populate the historical data table with "Read More" feature
                    populateHistoricalDataTable(data);

                    // Render historical data charts
                    renderHistoricalCharts(data);
                } else {
                    console.error("No historical data found.");
                }
            })
            .catch(error => {
                console.error("Error fetching historical data:", error);
            });
    }

    // Function to convert CSV text to array
    function csvToArray(csv) {
        const rows = csv.split("\n");
        return rows.map(row => row.split(","));
    }

    // Function to populate historical data table with a "Read More" feature
    function populateHistoricalDataTable(data) {
        const rowsToShow = 10; // Number of rows to display initially
        let currentRowCount = 0;

        // Clear previous historical data
        historicalDataTable.innerHTML = '';

        // Add rows with a limit
        data.forEach((row, index) => {
            if (index < rowsToShow) {
                let rowHtml = '<tr>';
                row.forEach(cell => {
                    rowHtml += `<td>${cell}</td>`; // Include each cell in the row
                });
                rowHtml += '</tr>';
                historicalDataTable.innerHTML += rowHtml;
                currentRowCount++;
            }
        });

        // Add the "Read More" button if there are more rows
        if (data.length > rowsToShow) {
            const readMoreButton = document.createElement('button');
            readMoreButton.id = 'readMoreButton';
            readMoreButton.textContent = 'Read More';
            readMoreButton.style.marginTop = '10px';
            historicalDataTable.parentNode.appendChild(readMoreButton);

            // Event listener for "Read More" button
            readMoreButton.addEventListener('click', () => {
                const rowsLeft = data.length - currentRowCount;
                const newRowsToShow = Math.min(rowsToShow, rowsLeft);

                // Add more rows
                for (let i = currentRowCount; i < currentRowCount + newRowsToShow; i++) {
                    if (i < data.length) {
                        let rowHtml = '<tr>';
                        data[i].forEach(cell => {
                            rowHtml += `<td>${cell}</td>`;
                        });
                        rowHtml += '</tr>';
                        historicalDataTable.innerHTML += rowHtml;
                    }
                }

                // Update current row count
                currentRowCount += newRowsToShow;

                // Hide the button if all rows are shown
                if (currentRowCount >= data.length) {
                    readMoreButton.style.display = 'none';
                }
            });
        }
    }

    // Function to render historical charts for current, power, and energy
    function renderHistoricalCharts(data) {
        const labels = data.map(row => row[0]); // Assuming first column is Date/Time
        const currentValues = data.map(row => row[2]); // Assuming second column is Current
        const voltageValues = data.map(row => row[6]); // Assuming third column is Voltage
        const powerValues = data.map(row => row[5]); // Assuming fourth column is Power
        const energyValues = data.map(row => row[3]); // Assuming fifth column is Energy

        // Render Current Chart
        new Chart(document.getElementById('currentDataChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Current (A)',
                    data: currentValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Render Power Chart
        new Chart(document.getElementById('powerDataChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Power (W)',
                    data: powerValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Render Energy Chart
        new Chart(historicalChartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energy Consumption (kWh)',
                    data: energyValues,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html'; // Redirect to login page after logout
        });
    })
});
