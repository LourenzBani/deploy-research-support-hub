import { auth, db, collection, query, where, getDocs, signOut } from '../server/firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event triggered');

    auth.onAuthStateChanged(async (user) => {
        const userNameSpan = document.getElementById('userName');
        const authButton = document.getElementById('authButton');
        const links = document.querySelectorAll('.nav-container a:not([href="/"]):not([href="/login"])');

        if (user) {
            console.log('User is logged in:', user.uid);

            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', user.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    console.log('User document found');
                    const userDoc = querySnapshot.docs[0].data();
                    userNameSpan.textContent = `${userDoc.fullName}`;

                    if (userDoc.isAdmin === true) {
                        console.log('User is an admin');
                        // Show admin link if user is an admin
                        const adminLink = document.querySelector('.admin-link');
                        if (adminLink) {
                            adminLink.style.display = 'block';
                            console.log('Admin link displayed');
                        }
                    } else {
                        console.log('User is not an admin');
                        hideAdminLink();
                    }
                } else {
                    console.log('No user document found for user:', user.uid);
                    hideAdminLink();
                }
            } catch (error) {
                console.error('Error fetching user document:', error);
                hideAdminLink();
            }

            // Update auth button for logged-in user
            authButton.textContent = 'Logout';
            authButton.href = '#';
            authButton.addEventListener('click', async (event) => {
                event.preventDefault();
                try {
                    await signOut(auth);
                    window.location.href = '/login';
                } catch (error) {
                    console.error('Sign out error:', error);
                }
            });
        } else {
            console.log('No user is logged in');
            userNameSpan.textContent = 'Hello, Student';
            authButton.textContent = 'Login';
            authButton.href = '/login';
            hideAdminLink();

            // Redirect non-logged-in users to home page if they try to access restricted pages
            links.forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    alert('Please log in to access this page.');
                    window.location.href = '/';
                });
            });
        }
    });

    function hideAdminLink() {
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
            adminLink.style.display = 'none';
            console.log('Admin link hidden');
        }
    }
});
