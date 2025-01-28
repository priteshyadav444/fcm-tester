// Initialize tooltips with custom triggers
document.addEventListener("DOMContentLoaded", function () {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl, {
      trigger: "hover focus", // Allow click, hover, and focus triggers
    });
  });
});

// Initialize Dropzone
const dropzone = new Dropzone("#dragDropFileArea", {
  url: "/upload", // Replace with your upload endpoint
  autoProcessQueue: false,
  clickable: true,
  maxFiles: 1,
  acceptedFiles: ".json",
  dictDefaultMessage: "Drag and drop your file here, or click to upload",
});

let serviceAccountJson = null;
let isFileAdded = false; // Flag to track if a file is uploaded

dropzone.on("addedfile", (file) => {
  // Prevent file upload if one is already added
  if (isFileAdded) {
    Swal.fire({
      icon: "warning",
      title: "File Limit Exceeded",
      text: "You can only upload one file. Please remove the existing file before uploading another.",
    });
    dropzone.removeFile(file); // Remove the newly added file
    return; // Exit the function to prevent further action
  }

  // Check if the file is a JSON file
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (fileExtension !== "json") {
    Swal.fire({
      icon: "error",
      title: "Invalid File Type",
      text: "Only .json files are allowed. Please upload a valid JSON file.",
    });
    dropzone.removeFile(file); // Remove the invalid file
    return; // Exit the function to prevent further action
  }

  const removeButton = Dropzone.createElement(
    '<button class="btn btn-danger btn-sm mt-1">Remove</button>'
  );

  // Add click event to remove the file
  removeButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isFileAdded = false; // Reset the flag when file is removed
    serviceAccountJson = null;
    // Remove the file from Dropzone
    dropzone.removeFile(file);
  });

  // Append the remove button to the file preview
  file.previewElement.appendChild(removeButton);

  console.log("File added:", file);
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      isFileAdded = true; // Mark file as added
      serviceAccountJson = JSON.parse(e.target.result);
    } catch (err) {
      // Handle JSON parsing error
      Swal.fire({
        icon: "error",
        title: "File Error",
        text: "Invalid JSON file. Please upload a valid JSON file.",
      });
      dropzone.removeFile(file); // Remove the invalid file
    }
  };

  // Read the file content as text
  reader.readAsText(file);
});

$(document).ready(function () {
  const currentURL = encodeURIComponent(window.location.href);

  $(".social-share a").each(function () {
    const href = $(this).attr("href").replace("#", currentURL);
    $(this).attr("href", href);
  });

  let formType = ""; // To store the form type

  $("#contactSupportBtn").click(() => {
    $("#commonModal").modal("show");
    openModal("support");
  });

  $("#reportIssueBtn").click(() => {
    $("#commonModal").modal("show");
    openModal("issue");
  });

  // Open modal with the appropriate type
  function openModal(type) {
    formType = type;
    const modalTitle =
      formType === "support" ? "Contact Support" : "Report Issue";
    $("#commonModalLabel").text(modalTitle);
  }

  // Clear the form when the modal opens or closes
  $("#commonModal").on("show.bs.modal", function () {
    $("#contactForm")[0].reset(); // Reset the form fields
  });

  $("#commonModal").on("hidden.bs.modal", function () {
    $("#contactForm")[0].reset(); // Reset the form fields
  });

  // Handle form submission
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    $("#contactFormSubmitBtn").prop("disabled", true);

    // Collect form data
    const formData = {
      type: formType,
      name: $("#name").val(),
      email: $("#email").val(),
      message: $("#query").val(),
    };

    // Send data to the API
    $.ajax({
      url: "api/send-email",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(formData),
      success: function (response) {
        $("#contactFormSubmitBtn").prop("disabled", false);
        Swal.fire({
          icon: "success",
          title: "Query Sent",
          text: response.message,
        });
        $("#commonModal").modal("hide");
      },
      error: function () {
        $("#contactFormSubmitBtn").prop("disabled", false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to send the email. Please try again.",
        });
      },
    });
  });

  // Toggle authentication method
  $("input[name='authMethod']").on("change", function () {
    const selectedMethod = $("input[name='authMethod']:checked").val();
    if (selectedMethod === "accessToken") {
      $("#accessTokenSection").show();
      $("#serviceFileSection").hide();
    } else {
      $("#accessTokenSection").hide();
      $("#serviceFileSection").show();
    }
  });

  // Show or hide optional fields
  $("#toggleOptionalFields").on("click", function () {
    const optionalFields = $("#optionalFields");
    if (optionalFields.is(":visible")) {
      optionalFields.hide();
      $(this).text("Show Optional Fields");
    } else {
      optionalFields.show();
      $(this).text("Hide Optional Fields");
    }
  });

  // Handle form submission
  $("#pushNotificationForm").on("submit", function (e) {
    e.preventDefault();

    // Collect form data
    const authMethod = $("input[name='authMethod']:checked").val();
    const deviceToken = $("#deviceToken").val().trim();
    const projectId = $("#projectId").val().trim();
    const title = $("#title").val().trim();
    const body = $("#message").val().trim();
    const icon = $("#icon").val().trim();
    let data = {};
    try {
      const dataInput = $("#data").val().trim();
      if (dataInput) {
        data = JSON.parse(dataInput);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Invalid Data",
        text: "The data field must contain valid JSON.",
      });
      return;
    }

    let payload = {
      deviceToken,
      projectId,
      title,
      body,
      icon,
      data,
    };

    // Validate required fields
    if (
      !deviceToken ||
      !title ||
      !body ||
      (!projectId && authMethod == "accessToken")
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill all required fields.",
      });
      return;
    }

    // Handle authentication
    if (authMethod === "accessToken") {
      const accessToken = $("#accessToken").val().trim();
      if (!accessToken) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Access Token is required.",
        });
        return;
      }
      payload.accessToken = accessToken;
    } else {
      payload.serviceAccount = serviceAccountJson;
      if (!isFileAdded) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Private key json File is required.",
        });
        return;
      }
    }

    // Send push notification
    sendPushNotification(payload);
  });

  // API call to initiate push notification
  function sendPushNotification(payload) {
    $("#sendPushNotificationBtn").prop("disabled", true);

    $.ajax({
      url: "/api/initiate-notification",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),
      success: function (response) {
        $("#sendPushNotificationBtn").prop("disabled", false);
        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "Notification Sent",
            text: "Push notification has been successfully sent.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message || "Failed to send push notification.",
          });
        }
      },
      error: function (xhr) {
        $("#sendPushNotificationBtn").prop("disabled", false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: xhr.responseJSON?.message || "An unexpected error occurred.",
        });
      },
    });
  }
});

// Handle file removal button
$("#generateTokenModal").on("hidden.bs.modal", function () {
  // Reset the form
  $("#generateTokenForm")[0].reset();
  $("#privateKeyFile").val("");
  $("#privateKeyJSON").val("");
  // Hide the "Remove File" button initially
  $("#removeFileBtn").hide();
});

$("#removeFileBtn").on("click", function () {
  $("#privateKeyFile").val(""); // Clear the file input
  $(this).hide(); // Hide the "Remove File" button
});

// Handle file input change
$("#privateKeyFile").on("change", function () {
  if (this.files && this.files[0]) {
    // Show "Remove File" button if a file is uploaded
    $("#removeFileBtn").show();
  } else {
    // Hide "Remove File" button if no file is selected
    $("#removeFileBtn").hide();
  }
});

// Handle Generate Access Token button click
$("#generateTokenBtn").on("click", function (e) {
  e.preventDefault();

  const privateKeyJSON = $("#privateKeyJSON").val().trim();
  const privateKeyFile = $("#privateKeyFile")[0].files[0];
  const apiUrl = "/api/generate-access-token"; // Your API endpoint

  // Validate input
  if (!privateKeyJSON && !privateKeyFile) {
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Please provide either a private key JSON or upload a private key file.",
    });
    return;
  }

  // Show a loading state
  Swal.fire({
    title: "Generating Access Token...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Function to send the API request
  const sendRequest = (jsonContent) => {
    const payload = jsonContent;
    // Make API request
    $("#generateTokenBtn").prop("disabled", true);
    $.ajax({
      url: apiUrl,
      type: "POST",
      contentType: "application/json",
      data: payload,
      success: function (response) {
        $("#generateTokenBtn").prop("disabled", false);

        if (response.success) {
          Swal.fire({
            icon: "success",
            title: "Access Token Generated",
            html: `
                <p>Access Token:</p>
                <textarea class="form-control" id="generatedAccessToken" readonly rows="5">${response.data.accessToken}</textarea>
              `,
            footer: `
                <button id="copyAccessTokenBtn" class="btn btn-secondary">Copy and Close</button>
                <button id="closeSwalBtn" class="btn btn-primary">Close</button>
              `,
            showConfirmButton: false, // Hide the default confirm button
            didOpen: () => {
              // Handle the "Copy" button click
              document
                .getElementById("copyAccessTokenBtn")
                .addEventListener("click", () => {
                  const accessToken = document.getElementById(
                    "generatedAccessToken"
                  );
                  accessToken.select(); // Select the text in the textarea
                  accessToken.setSelectionRange(0, 99999); // For mobile devices
                  $("#generateTokenModal").modal("hide");
                  navigator.clipboard
                    .writeText(accessToken.value)
                    .then(() => {
                      Swal.fire({
                        icon: "success",
                        title: "Copied!",
                        text: "Access token copied to clipboard.",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                      $("#generateTokenModal").modal("hide");
                    })
                    .catch(() => {
                      Swal.fire({
                        icon: "error",
                        title: "Copy Failed",
                        text: "Could not copy the access token.",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                    });
                });

              // Handle the "Close" button click
              document
                .getElementById("closeSwalBtn")
                .addEventListener("click", () => {
                  Swal.close(); // Close the Swal modal
                  $("#generateTokenModal").modal("hide");
                  $("#privateKeyFile").val("");
                });
            },
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message || "Failed to generate access token.",
          });
        }
      },
      error: function (xhr) {
        $("#generateTokenBtn").prop("disabled", false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: xhr.responseJSON?.error || "An unexpected error occurred.",
        });
      },
    });
  };

  // If file is uploaded, read its content
  if (privateKeyFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const fileContent = e.target.result;
        sendRequest(fileContent); // Send the file content as JSON
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "File Error",
          text: "Failed to read the file content.",
        });
      }
    };
    reader.onerror = function () {
      Swal.fire({
        icon: "error",
        title: "File Error",
        text: "An error occurred while reading the file.",
      });
    };
    reader.readAsText(privateKeyFile); // Read file as text
  } else {
    // Use the JSON string from the input field
    sendRequest(privateKeyJSON);
  }
});
