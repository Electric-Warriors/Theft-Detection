document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const statusMessage = document.getElementById('statusMessage');

    // Firebase references
    const auth = firebase.auth();
    const database = firebase.database();

    // Login form submission handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value; // Corrected to match input IDs
        const password = document.getElementById('password').value; // Corrected to match input IDs

        // Sign in the user
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Check user's authKey to determine redirection
                database.ref('users/' + user.uid).once('value')
                    .then(snapshot => {
                        const userData = snapshot.val();
                        if (userData && userData.authkey === 'GLOBAL') {
                            // Redirect to authority profile
                            window.location.href = 'authorityProfile.html';
                        } else {
                            // Redirect to consumer profile
                            window.location.href = 'consumerProfile.html';
                        }
                    })
                    .catch((error) => {
                        statusMessage.textContent = "Error fetching user data: " + error.message;
                    });
            })
            .catch((error) => {
                statusMessage.textContent = "Error: " + error.message;
            });
    });
});