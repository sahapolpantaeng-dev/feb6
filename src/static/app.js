document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const registrationForm = document.getElementById("registration-form");
  const modal = document.getElementById("registration-modal");
  const closeModalBtn = document.querySelector(".close-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const modalMessage = document.getElementById("modal-message");
  let currentActivity = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-btn" data-activity="${name}">Register Student</button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", openRegistrationModal);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Open registration modal
  function openRegistrationModal(event) {
    const button = event.target;
    currentActivity = button.getAttribute("data-activity");
    modalActivityName.textContent = `Activity: ${currentActivity}`;
    modalMessage.classList.add("hidden");
    document.getElementById("student-email").value = "";
    modal.classList.remove("hidden");
  }

  // Close registration modal
  function closeRegistrationModal() {
    modal.classList.add("hidden");
    currentActivity = null;
  }

  // Handle form submission
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("student-email").value;

    if (!currentActivity) {
      showModalMessage("Please select an activity", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          currentActivity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showModalMessage(result.message, "success");
        registrationForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();

        // Close modal after a short delay
        setTimeout(() => {
          closeRegistrationModal();
        }, 1500);
      } else {
        showModalMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showModalMessage("Failed to register. Please try again.", "error");
      console.error("Error registering:", error);
    }
  });

  // Show message helper
  function showMessage(message, type) {
    // Create a temporary message div
    const tempMessage = document.createElement("div");
    tempMessage.className = `message ${type}`;
    tempMessage.textContent = message;
    tempMessage.style.position = "fixed";
    tempMessage.style.top = "20px";
    tempMessage.style.right = "20px";
    tempMessage.style.zIndex = "10000";
    tempMessage.style.maxWidth = "400px";
    document.body.appendChild(tempMessage);

    // Remove after 5 seconds
    setTimeout(() => {
      tempMessage.remove();
    }, 5000);
  }

  // Show modal message helper
  function showModalMessage(message, type) {
    modalMessage.textContent = message;
    modalMessage.className = `message ${type}`;
    modalMessage.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      modalMessage.classList.add("hidden");
    }, 5000);
  }

  // Close modal when clicking X
  closeModalBtn.addEventListener("click", closeRegistrationModal);

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeRegistrationModal();
    }
  });

  // Initialize app
  fetchActivities();
});
