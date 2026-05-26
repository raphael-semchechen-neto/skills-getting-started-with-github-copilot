document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so we don't duplicate options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ol class="participant-list">
              ${participants.length
                ? participants
                    .map(
                      (participant) =>
                        `<li><span class="participant-email">${participant}</span><button class="remove-participant" data-activity="${name}" data-email="${participant}" aria-label="Remove participant">\n                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n                            <path d="M3 6h18" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>\n                            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n                            <path d="M10 11v6" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>\n                            <path d="M14 11v6" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>\n                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n                          </svg>\n                        </button></li>`
                    )
                    .join("")
                : `<li class="no-participants">No students signed up yet.</li>`}
            </ol>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers to each remove button in this card
        const removeButtons = activityCard.querySelectorAll('.remove-participant');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;

            if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );

              const payload = await res.json();
              if (res.ok) {
                messageDiv.textContent = payload.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                // Refresh list
                fetchActivities();
              } else {
                messageDiv.textContent = payload.detail || 'Failed to unregister';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }

              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error unregistering participant:', err);
              messageDiv.textContent = 'Failed to unregister. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

      // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Sign Up';

    try {
      // show loading state on submit button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Signing up...';
      }

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      // restore submit button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalBtnText;
      }
    }
  });

  // Initialize app
  fetchActivities();
});
