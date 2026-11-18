import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convex = new ConvexHttpClient(
    "https://proficient-alpaca-701.eu-west-1.convex.cloud"
);

const form = document.querySelector("#event-enquiry-form");
const status = document.querySelector("#form-status");

function showSuccessScreen() {
    const overlay = document.createElement("div");

    overlay.className = "submission-overlay";

    overlay.innerHTML = `
        <div class="submission-success" role="dialog"
             aria-modal="true" aria-labelledby="success-title">

            <div class="success-icon">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle class="success-circle"
                            cx="50" cy="50" r="44"/>
                    <path class="success-check"
                          d="M28 51 L43 66 L73 35"/>
                </svg>
            </div>

            <p class="success-label">JM STAFFING SOLUTIONS</p>

            <h1 id="success-title">ENQUIRY SUBMITTED!</h1>

            <p class="success-message">
                Thank you for choosing JM Staffing Solutions.
                Your enquiry has been successfully received.
            </p>

            <p class="success-reference">
                Our team will review your enquiry.
            </p>

            <button type="button" class="success-continue">
                Continue
            </button>

            <p class="success-footer">
                SERVICE THAT SHINES.
            </p>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("submission-open");

    const continueButton = overlay.querySelector(".success-continue");

    continueButton.addEventListener("click", function () {
        overlay.classList.add("submission-closing");

        setTimeout(function () {
            overlay.remove();
            document.body.classList.remove("submission-open");
            form.querySelector('button[type="submit"]').focus();
        }, 250);
    });

    continueButton.focus();
}

if (form && status) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const guestValue = form.elements.namedItem("guests").value.trim();

        const enquiry = {
            fullName: form.elements.namedItem("name").value.trim(),
            email: form.elements.namedItem("email").value.trim(),
            phone: form.elements.namedItem("phone").value.trim(),
            eventType: form.elements.namedItem("event").value.trim(),
            eventDate: form.elements.namedItem("date").value,
            guestCount: guestValue === "" ? null : Number(guestValue),
            message: form.elements.namedItem("message").value.trim()
        };

        button.disabled = true;
        button.textContent = "Submitting...";

        status.className = "form-note form-status is-loading";
        status.textContent = "Submitting your enquiry. Please wait.";

        try {
            await convex.mutation(api.enquiries.submit, enquiry);

            form.reset();

            status.className = "form-note form-status is-success";
            status.textContent = "Your enquiry was successfully submitted.";

            showSuccessScreen();

        } catch (error) {
            console.error("Enquiry submission failed:", error);

            status.className = "form-note form-status is-error";
            status.textContent =
                "We couldn't submit your enquiry. Please check your details and try again.";

        } finally {
            button.disabled = false;
            button.textContent = "Submit Enquiry";
        }
    });
}
