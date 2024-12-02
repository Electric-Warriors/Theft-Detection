document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const loginForm = document.getElementById('loginForm'); // Assuming you have a login form
    const statusMessage = document.getElementById('statusMessage');

    // Firebase references
    const auth = firebase.auth();
    const database = firebase.database();

    // Registration form submission handler
    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const phone = document.getElementById('phone').value;
        const authKey = document.getElementById('authKey').value; // Get auth key from input

        // Check if authKey is valid
        database.ref().once('value', (snapshot) => {
            let validKey = false;

            snapshot.forEach((childSnapshot) => {
                const childKey = childSnapshot.key;
                if (childKey === authKey || (authKey === "GLOBAL" && childKey !== "users")) {
                    validKey = true;
                    return true; // Break out of forEach
                }
            });

            if (!validKey) {
                statusMessage.textContent = "Invalid Authentication Key!";
                return; // Exit if key is invalid
            }

            // Register user with Firebase Authentication
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    // Save user details to Realtime Database
                    database.ref('users/' + user.uid).set({
                        name: name,
                        email: email,
                        phone: phone,
                        createdAt: new Date().toISOString(),
                        authkey: authKey // Save the auth key for the user
                    });

                    statusMessage.textContent = "Registration successful!";
                    registrationForm.reset();
                })
                .catch((error) => {
                    statusMessage.textContent = "Error: " + error.message;
                });
        });
    });

    // Login form submission handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value; // Assuming your login form has this field
        const password = document.getElementById('loginPassword').value; // Assuming your login form has this field

        // Sign in with Firebase Authentication
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Check user's authKey to determine redirection
                database.ref('users/' + user.uid).once('value')
                    .then(snapshot => {
                        const userData = snapshot.val();
                        if (userData.authKey === 'GLOBAL') {
                            // Redirect to authority profile
                            window.location.href = 'authorityProfile.html';
                        } else {
                            // Redirect to consumer profile
                            window.location.href = 'consumerProfile.html';
                        }
                    });
            })
            .catch((error) => {
                statusMessage.textContent = "Error: " + error.message;
            });
    });
});