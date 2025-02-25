import { auth, db, onAuthStateChanged, signOut, collection, query, where, getDocs, addDoc } from '../server/firebase.js'

document.addEventListener('DOMContentLoaded', function () {
  console.log('Document loaded, attaching event listener to form')

  onAuthStateChanged(auth, async (user) => {
    const userNameSpan = document.getElementById('userName')
    const authButton = document.getElementById('authButton')
    if (user) {
      // User is logged in
      try {
        // Query Firestore to find the user document by email
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('email', '==', user.email))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          const userData = userDoc.data()
          // current user header sign in
          userNameSpan.textContent = `${userData.fullName}`
        } else {
          userNameSpan.textContent = 'Hello, User'
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        userNameSpan.textContent = ''
      }

      // Sign out the user
      authButton.textContent = 'Logout'
      authButton.href = '#'
      authButton.addEventListener('click', async (event) => {
        event.preventDefault()
        try {
          await signOut(auth)
          window.location.href = '/login'
        } catch (error) {
          console.error('Sign out error:', error)
        }
      })
    } else {
      // No user is logged in
      userNameSpan.textContent = ''
      authButton.textContent = 'Login'
      authButton.href = '/login'
    }
  })

  async function resReq (event) {
    event.preventDefault() // Prevent the form from submitting the default way

    console.log('Form submission started')

    const title = document.getElementById('title').value
    const desc = document.getElementById('desc').value
    const contact = document.getElementById('contact').value
    const dgMethod = document.getElementById('dg_method').value
    const typePart = document.getElementById('typeOfParticipation').value
    const dgLink = document.getElementById('dg_link').value
    const startDate = document.getElementById('start_date').value
    const endDate = document.getElementById('end_date').value

    const user = auth.currentUser

    if (!user) {
      console.error('No user is signed in')
      alert('You need to be signed in to submit a research request.')
      return
    }

    // Validate the dates
    if (new Date(endDate) <= new Date(startDate)) {
      alert('End date must be after the start date.')
      return
    }

    const userId = user.uid

    const newResReq = {
      title,
      desc,
      contact,
      dgMethod,
      typePart,
      dgLink,
      startDate,
      endDate,
      isApproved: "pending", // Add the isApproved field with default value false
      userId // Include the user's ID
    }

    console.log('Data to be sent to Firestore:', newResReq)

    try {
      // Save the new research request to Firestore
      await addDoc(collection(db, 'research_requests'), newResReq);
      console.log('Research request submitted successfully!');
      alert('Research request submitted successfully!');
      document.getElementById('resReqForm').reset();

      // Fetch admins and send email notifications
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('isAdmin', '==', true));
      const adminSnapshot = await getDocs(adminQuery);

      const adminEmails = adminSnapshot.docs.map(doc => doc.data().email).filter(email => email)

      if (adminEmails.length > 0) {
        const subject = `New Research Request Submitted: "${title}"`
        const text = `A new research request titled "${title}" has been submitted.\n\nDetails:\nTitle: ${title}\nDescription: ${desc}\nContact: ${contact}\nDate Range: ${startDate} to ${endDate}\n\nPlease review the request in the system.`
        const html = `<p>A new research request titled "<strong>${title}</strong>" has been submitted.</p><p><strong>Details:</strong></p><p>Title: ${title}</p><p>Description: ${desc}</p><p>Contact: ${contact}</p><p>Date Range: ${startDate} to ${endDate}</p><p>Please review the request in the system.</p>`

        try {
          const emailResponse = await fetch('/sendEmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: adminEmails,
              subject,
              text,
              html
            })
          })

          if (emailResponse.ok) {
            console.log('Emails sent to admins successfully.')
          } else {
            console.error('Error sending emails to admins:', emailResponse.statusText)
          }
        } catch (error) {
          console.error('Error sending emails to admins:', error)
        }
      } else {
        console.log('No admin emails to send.')
      }
    } catch (error) {
      console.error('Failed to submit research request or send admin notifications:', error)
      alert('Failed to submit research request or send admin notifications: ' + error.message)
    }
  }

  const form = document.getElementById('resReqForm')
  form.addEventListener('submit', resReq)

  document.getElementById('submitReqButton').addEventListener('click', function () {
    console.log('Request button clicked')
  })
})
