const PawLinkUI = (() => {

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


  // ==========================================
  // MODALS
  // ==========================================

  function openModal(selector) {

    const modal = $(selector);

    if (!modal) return;

    modal.classList.add("is-open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeModal(selector) {

    const modal = $(selector);

    if (!modal) return;

    modal.classList.remove("is-open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  function setupModals() {

    // Open authentication modal
    $$("[data-open-auth]").forEach(button => {

      button.addEventListener(
        "click",
        () => {
          openModal(
            "[data-auth-modal]"
          );
        }
      );

    });


    // Close authentication modal
    $$("[data-close-auth]").forEach(button => {

      button.addEventListener(
        "click",
        () => {
          closeModal(
            "[data-auth-modal]"
          );
        }
      );

    });


    // Close by clicking outside
    $$(".modal-backdrop").forEach(backdrop => {

      backdrop.addEventListener(
        "click",
        event => {

          if (
            event.target === backdrop
          ) {

            backdrop.classList.remove(
              "is-open"
            );

            backdrop.setAttribute(
              "aria-hidden",
              "true"
            );

          }

        }
      );

    });


    // Escape key
    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key !== "Escape"
        ) {
          return;
        }

        $$(".modal-backdrop.is-open")
          .forEach(modal => {

            modal.classList.remove(
              "is-open"
            );

            modal.setAttribute(
              "aria-hidden",
              "true"
            );

          });

      }
    );

  }


  // ==========================================
  // AUTHENTICATION FORM
  // ==========================================

  function setupAuthForm() {

    const form =
      $("[data-auth-form]");

    if (!form) {

      console.log(
        "Authentication form not found."
      );

      return;
    }


    const modeInput =
      $('input[name="mode"]', form);

    const registerFields =
      $("[data-register-only]", form);

    const heading =
      $("[data-auth-heading]");

    const submitButton =
      $("[data-auth-submit]");

    const switchArea =
      $("[data-auth-switch]");

    const message =
      $("[data-auth-message]");


    if (
      !modeInput ||
      !registerFields ||
      !heading ||
      !submitButton
    ) {

      console.error(
        "Authentication form elements are missing."
      );

      return;
    }


    // ------------------------------------------
    // UPDATE LOGIN / REGISTER MODE
    // ------------------------------------------

    function updateAuthMode(mode) {

      const isRegister =
        mode === "register";


      modeInput.value =
        isRegister
          ? "register"
          : "signin";


      registerFields.hidden =
        !isRegister;


      heading.textContent =
        isRegister
          ? "Create your PawLink account"
          : "Welcome back to PawLink";


      submitButton.textContent =
        isRegister
          ? "Create account"
          : "Sign in securely";


      if (message) {

        message.textContent = "";

        message.className =
          "auth-message";

      }


      // Required fields
      $$(
        "[data-register-only] input, " +
        "[data-register-only] select",
        form
      ).forEach(field => {

        field.required =
          isRegister;

      });


      // Switch button
      if (switchArea) {

        if (isRegister) {

          switchArea.innerHTML =
            `
              Already have an account?

              <button
                type="button"
                data-auth-mode="signin"
              >
                Sign in
              </button>
            `;

        } else {

          switchArea.innerHTML =
            `
              New to PawLink?

              <button
                type="button"
                data-auth-mode="register"
              >
                Create an account
              </button>
            `;

        }

      }

    }


    // ------------------------------------------
    // LOGIN / REGISTER SWITCH
    // ------------------------------------------

    document.addEventListener(
      "click",
      event => {

        const modeButton =
          event.target.closest(
            "[data-auth-mode]"
          );

        if (!modeButton) return;

        event.preventDefault();

        updateAuthMode(
          modeButton.dataset.authMode
        );

      }
    );


    // ------------------------------------------
    // SUBMIT
    // ------------------------------------------

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (
          !window.PawLinkAuth ||
          typeof window.PawLinkAuth.signIn !==
            "function"
        ) {

          if (message) {

            message.textContent =
              "Firebase is still loading. Please wait a moment and try again.";

            message.className =
              "auth-message error";

          }

          return;
        }


        const formData =
          Object.fromEntries(
            new FormData(form)
          );


        const mode =
          String(
            formData.mode ||
            "signin"
          );


        const email =
          String(
            formData.email ||
            ""
          ).trim();


        const password =
          String(
            formData.password ||
            ""
          );


        // --------------------------------------
        // VALIDATION
        // --------------------------------------

        if (!email || !password) {

          if (message) {

            message.textContent =
              "Please enter your email and password.";

            message.className =
              "auth-message error";

          }

          return;
        }


        if (
          password.length < 6
        ) {

          if (message) {

            message.textContent =
              "Password should contain at least 6 characters.";

            message.className =
              "auth-message error";

          }

          return;
        }


        submitButton.disabled =
          true;


        submitButton.textContent =
          mode === "register"
            ? "Creating account..."
            : "Signing in...";


        if (message) {

          message.textContent = "";

          message.className =
            "auth-message";

        }


        try {

          // ------------------------------------
          // REGISTER
          // ------------------------------------

          if (
            mode === "register"
          ) {

            const name =
              String(
                formData.name ||
                ""
              ).trim();


            const city =
              String(
                formData.city ||
                ""
              );


            const requestedRole =
              String(
                formData.requestedRole ||
                "citizen"
              );


            if (!name) {

              throw new Error(
                "Please enter your full name."
              );

            }


            if (!city) {

              throw new Error(
                "Please select your city."
              );

            }


            await window.PawLinkAuth.register({

              name,

              email,

              password,

              city,

              requestedRole

            });

          }


          // ------------------------------------
          // LOGIN
          // ------------------------------------

          else {

            await window.PawLinkAuth.signIn(
              email,
              password
            );

          }


        } catch (error) {

          console.error(
            "Authentication error:",
            error
          );


          if (message) {

            message.textContent =
              error?.message ||
              "Authentication failed. Please try again.";

            message.className =
              "auth-message error";

          }


          submitButton.disabled =
            false;


          submitButton.textContent =
            mode === "register"
              ? "Create account"
              : "Sign in securely";

        }

      }
    );


    // Initial mode
    updateAuthMode(
      "signin"
    );

  }


  // ==========================================
  // PHOTO PREVIEW
  // ==========================================

  function setupPhotoPreview() {

    const input =
      $("#case-photo");

    const preview =
      $("#photo-preview");


    if (!input || !preview) {
      return;
    }


    input.addEventListener(
      "change",
      () => {

        const file =
          input.files?.[0];


        if (!file) {

          preview.hidden =
            true;

          return;

        }


        if (
          !file.type.startsWith(
            "image/"
          )
        ) {

          preview.hidden =
            true;

          return;

        }


        preview.src =
          URL.createObjectURL(
            file
          );

        preview.hidden =
          false;

      }
    );

  }


  // ==========================================
  // LOCATION
  // ==========================================

  function setupLocation() {

    const button =
      $("#use-location");

    const input =
      $("#case-location");

    const status =
      $("#location-status");


    if (!button || !input) {
      return;
    }


    button.addEventListener(
      "click",
      () => {

        if (
          !navigator.geolocation
        ) {

          if (status) {

            status.textContent =
              "Location is not available in this browser.";

          }

          return;
        }


        button.disabled =
          true;


        button.textContent =
          "Finding you...";


        navigator.geolocation.getCurrentPosition(

          position => {

            const {
              latitude,
              longitude
            } = position.coords;


            input.value =
              `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;


            input.dataset.latitude =
              latitude;


            input.dataset.longitude =
              longitude;


            if (status) {

              status.textContent =
                "Location added successfully.";

            }


            button.textContent =
              "⌖ Location added";


            button.disabled =
              false;

          },


          () => {

            if (status) {

              status.textContent =
                "We could not access your location. Please enter a nearby landmark.";

            }


            button.disabled =
              false;


            button.textContent =
              "⌖ Use my location";

          },


          {
            enableHighAccuracy: true,
            timeout: 10000
          }

        );

      }
    );

  }


  // ==========================================
  // CASE REPORT
  // ==========================================

  function setupCaseForm() {

    const form =
      $("#case-report-form");


    if (!form) {
      return;
    }


    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const data =
          Object.fromEntries(
            new FormData(form)
          );


        const locationInput =
          $("#case-location");


        const reference =
          `PL-${Math.floor(
            1000 +
            Math.random() * 9000
          )}`;


        const record = {

          ...data,

          reference,

          latitude:
            locationInput?.dataset.latitude ||
            null,

          longitude:
            locationInput?.dataset.longitude ||
            null,

          status:
            "Awaiting responder",

          createdAt:
            new Date().toISOString()

        };


        const submit =
          $(".submit-report", form);


        if (submit) {

          submit.disabled =
            true;

          submit.innerHTML =
            "Sending request...";

        }


        try {

          if (
            window.PawLinkCases?.create
          ) {

            const result =
              await window.PawLinkCases.create(
                record
              );


            console.log(
              "Firebase case created:",
              result
            );

          } else {

            throw new Error(
              "Firebase case service is not ready."
            );

          }


          const referenceElement =
            $("#case-reference");


          if (referenceElement) {

            referenceElement.textContent =
              reference;

          }


          const trackLink =
            $("#track-case-link");


          if (trackLink) {

            trackLink.href =
              `role.html?case=${reference}`;

          }


          openModal(
            "[data-success-modal]"
          );


        } catch (error) {

          console.error(
            "Case submission error:",
            error
          );


          alert(
            error?.message ||
            "Unable to submit the case. Please login and try again."
          );

        }


        if (submit) {

          submit.disabled =
            false;

          submit.innerHTML =
            `Send help request <span>→</span>`;

        }

      }
    );

  }


  // ==========================================
  // DASHBOARD SAMPLE DATA
  // ==========================================

  const roleData = {

    citizen: {

      kicker:
        "YOUR CASE UPDATES",

      title:
        "Your care dashboard",

      welcome:
        "Bruno has a caring team around him.",

      text:
        "Follow each meaningful update from rescue through recovery. You’re never left wondering what happened next.",

      action:
        "View Bruno’s case",

      stats: [

        [
          "1",
          "active case",
          "Bruno is at the clinic"
        ],

        [
          "3",
          "care updates",
          "Shared with you today"
        ],

        [
          "1",
          "team on case",
          "Vet + rescue team"
        ],

        [
          "14 min",
          "first response",
          "Faster than average"
        ]

      ],

      cases: [

        [
          "🐶",
          "Bruno · Injured indie dog",
          "PL-2084",
          "At clinic",
          "safe",
          "Lake Road",
          "12 min ago"
        ],

        [
          "🐱",
          "Misty · Kitten found alone",
          "PL-2079",
          "Recovering",
          "safe",
          "Happy Tails Shelter",
          "Yesterday"
        ]

      ]

    },


    vet: {

      kicker:
        "YOUR CLINIC WORKSPACE",

      title:
        "Your clinic workspace",

      welcome:
        "2 animals need a response nearby.",

      text:
        "Review case history, share care notes, and keep every handover clear for the animal and team.",

      action:
        "View urgent cases",

      stats: [

        [
          "2",
          "awaiting triage",
          "1 new since 9:00 AM"
        ],

        [
          "7",
          "under your care",
          "3 follow-ups today"
        ],

        [
          "3",
          "prescriptions",
          "Awaiting fulfilment"
        ],

        [
          "96%",
          "care updates",
          "Completed on time"
        ]

      ],

      cases: [

        [
          "🐶",
          "Bruno · Injured indie dog",
          "PL-2084",
          "Needs examination",
          "critical",
          "Lake Road · 1.4 km",
          "4 min ago"
        ],

        [
          "🐱",
          "Misty · Kitten found alone",
          "PL-2079",
          "Follow-up today",
          "safe",
          "Happy Tails Shelter",
          "32 min ago"
        ],

        [
          "🕊️",
          "Pigeon · Wing injury",
          "PL-2091",
          "Awaiting triage",
          "critical",
          "Central Park · 2.1 km",
          "46 min ago"
        ]

      ]

    },


    ngo: {

      kicker:
        "YOUR RESCUE WORKSPACE",

      title:
        "Your rescue workspace",

      welcome:
        "2 urgent pickup requests are close by.",

      text:
        "Assign a volunteer, update the handover, and let the person who reported the animal know help is on the way.",

      action:
        "Dispatch a responder",

      stats: [

        [
          "2",
          "urgent pickups",
          "Closest is 8 min away"
        ],

        [
          "6",
          "team members",
          "4 available now"
        ],

        [
          "11",
          "open cases",
          "Across 3 neighbourhoods"
        ],

        [
          "89%",
          "response rate",
          "This month"
        ]

      ],

      cases: [

        [
          "🐶",
          "Bruno · Injured indie dog",
          "PL-2084",
          "Pickup needed",
          "critical",
          "Lake Road · 1.4 km",
          "4 min ago"
        ],

        [
          "🐱",
          "Misty · Kitten found alone",
          "PL-2079",
          "Shelter handover",
          "safe",
          "Happy Tails Shelter",
          "32 min ago"
        ],

        [
          "🐕",
          "Kalu · Roadside rescue",
          "PL-2076",
          "Volunteer assigned",
          "safe",
          "Station Road · 3 km",
          "1 hr ago"
        ]

      ]

    },


    shelter: {

      kicker:
        "YOUR SHELTER WORKSPACE",

      title:
        "Your shelter workspace",

      welcome:
        "You have space for one more recovery case.",

      text:
        "Coordinate intake, care plans, and the next hopeful chapter for every animal in your shelter.",

      action:
        "View incoming case",

      stats: [

        [
          "1",
          "bed available",
          "Recovery ward"
        ],

        [
          "18",
          "animals in care",
          "4 adoption-ready"
        ],

        [
          "3",
          "arrivals today",
          "1 awaiting handover"
        ],

        [
          "6",
          "care tasks",
          "Due before 5 PM"
        ]

      ],

      cases: [

        [
          "🐱",
          "Misty · Kitten found alone",
          "PL-2079",
          "Recovery bed held",
          "safe",
          "Happy Tails Shelter",
          "32 min ago"
        ],

        [
          "🐶",
          "Bruno · Injured indie dog",
          "PL-2084",
          "Intake requested",
          "critical",
          "Lake Road · 1.4 km",
          "4 min ago"
        ],

        [
          "🐕",
          "Kalu · Roadside rescue",
          "PL-2076",
          "Foster match found",
          "safe",
          "Station Road",
          "1 hr ago"
        ]

      ]

    },


    pharmacy: {

      kicker:
        "YOUR PHARMACY WORKSPACE",

      title:
        "Your pharmacy workspace",

      welcome:
        "3 verified prescriptions need an update.",

      text:
        "Confirm availability and keep care teams informed when essential medicine is ready for pickup.",

      action:
        "Review prescriptions",

      stats: [

        [
          "3",
          "new prescriptions",
          "All verified by vets"
        ],

        [
          "2",
          "ready for pickup",
          "Notify care team"
        ],

        [
          "1",
          "stock request",
          "Item low: wound spray"
        ],

        [
          "14",
          "fulfilled this week",
          "100% on time"
        ]

      ],

      cases: [

        [
          "💊",
          "Bruno · Pain relief + dressing",
          "RX-2084",
          "Awaiting stock check",
          "critical",
          "Lake Road Clinic",
          "4 min ago"
        ],

        [
          "💊",
          "Misty · Kitten formula",
          "RX-2079",
          "Ready for pickup",
          "safe",
          "Happy Tails Shelter",
          "32 min ago"
        ],

        [
          "💊",
          "Kalu · Antibiotic course",
          "RX-2076",
          "Ready for pickup",
          "safe",
          "Station Road",
          "1 hr ago"
        ]

      ]

    },


    authority: {

      kicker:
        "CITY CARE OVERVIEW",

      title:
        "Municipal response dashboard",

      welcome:
        "Three wards need attention this week.",

      text:
        "See the clearest picture of local animal-care needs, from urgent rescue reports to vaccination and sterilisation planning.",

      action:
        "View area insights",

      stats: [

        [
          "47",
          "reports this week",
          "12% lower than last week"
        ],

        [
          "82%",
          "cases responded",
          "Target: 90%"
        ],

        [
          "3",
          "high-priority wards",
          "Lake, Market, North"
        ],

        [
          "126",
          "vaccinations logged",
          "This month"
        ]

      ],

      cases: [

        [
          "🐶",
          "Lake Ward · Roadside injury",
          "PL-2084",
          "Response active",
          "critical",
          "Lake Road",
          "4 min ago"
        ],

        [
          "🐕",
          "Market Ward · ABC request",
          "PL-2076",
          "Scheduled",
          "safe",
          "Station Road",
          "1 hr ago"
        ],

        [
          "🐱",
          "North Ward · Abandoned litter",
          "PL-2079",
          "Shelter care",
          "safe",
          "Central Park",
          "32 min ago"
        ]

      ]

    }

  };


  // ==========================================
  // DASHBOARD
  // ==========================================

  function setupDashboard() {

    const statsRoot =
      $("#dashboard-stats");


    // Not a dashboard page
    if (!statsRoot) {
      return;
    }


    async function loadDashboard() {

      console.log(
        "Loading PawLink dashboard..."
      );


      const auth =
        window.PawLinkAuth;


      // --------------------------------------
      // CHECK LOGIN
      // --------------------------------------

      if (
        !auth ||
        !auth.user
      ) {

        console.log(
          "No logged-in Firebase user."
        );


        window.location.href =
          "index.html";

        return;
      }


      // --------------------------------------
      // FIRESTORE PROFILE
      // --------------------------------------

      const profile =
        auth.profile;


      if (!profile) {

        console.error(
          "Firestore profile not found."
        );


        window.location.href =
          "index.html";

        return;
      }


      console.log(
        "Firebase user:",
        auth.user.email
      );


      console.log(
        "Firestore profile:",
        profile
      );


      // --------------------------------------
      // ROLE FROM FIRESTORE
      // --------------------------------------

      const savedRole =
        String(
          profile.role ||
          "citizen"
        ).toLowerCase();


      const role =
        roleData[savedRole]
          ? savedRole
          : "citizen";


      const city =
        profile.city ||
        "Your city";


      const data =
        roleData[role];


      console.log(
        "Dashboard role:",
        role
      );


      console.log(
        "Dashboard city:",
        city
      );


      // --------------------------------------
      // USER NAME
      // --------------------------------------

      const userName =
        profile.name ||
        auth.user.displayName ||
        "PawLink User";


      // --------------------------------------
      // ROLE LABEL
      // --------------------------------------

      const roleNames = {

        citizen:
          "Citizen",

        vet:
          "Veterinary Clinic",

        ngo:
          "NGO / Rescue Team",

        shelter:
          "Shelter",

        pharmacy:
          "Pharmacy",

        authority:
          "Municipal Authority"

      };


      const readableRole =
        roleNames[role] ||
        "Citizen";


      // --------------------------------------
      // USER NAME
      // --------------------------------------

      const userNameElement =
        $("#user-name");


      if (userNameElement) {

        userNameElement.textContent =
          userName;

      }


      // --------------------------------------
      // USER ROLE
      // --------------------------------------

      const userRoleElement =
        $("#user-role");


      if (userRoleElement) {

        userRoleElement.textContent =
          readableRole;

      }


      // --------------------------------------
      // USER INITIALS
      // --------------------------------------

      const initialsElement =
        $("#user-initials");


      if (initialsElement) {

        const initials =
          userName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
              word =>
                word
                  .charAt(0)
            )
            .join("")
            .toUpperCase();


        initialsElement.textContent =
          initials ||
          "PL";

      }


      // --------------------------------------
      // DASHBOARD HEADER
      // --------------------------------------

      document.title =
        `${data.title} | PawLink`;


      const roleKicker =
        $("#role-kicker");


      if (roleKicker) {

        roleKicker.textContent =
          data.kicker;

      }


      const dashboardTitle =
        $("#dashboard-title");


      if (dashboardTitle) {

        dashboardTitle.textContent =
          data.title;

      }


      // --------------------------------------
      // WELCOME
      // --------------------------------------

      const welcomeTitle =
        $("#welcome-title");


      if (welcomeTitle) {

        welcomeTitle.textContent =
          data.welcome;

      }


      const welcomeText =
        $("#welcome-text");


      if (welcomeText) {

        welcomeText.textContent =
          `${data.text} Showing cases in ${city}.`;

      }


      // --------------------------------------
      // PRIMARY ACTION
      // --------------------------------------

      const primaryAction =
        $("#primary-dashboard-action");


      if (primaryAction) {

        primaryAction.innerHTML =
          `${data.action} <span>→</span>`;

      }


      // --------------------------------------
      // STATS
      // --------------------------------------

      statsRoot.innerHTML =
        data.stats
          .map(
            (stat, index) => `

              <article
                class="dash-stat ${
                  index === 0
                    ? "alert"
                    : ""
                }"
              >

                <span>
                  ${stat[1]}
                </span>

                <strong>
                  ${stat[0]}
                </strong>

                <small>
                  ${stat[2]}
                </small>

              </article>

            `
          )
          .join("");


      // --------------------------------------
      // CASE TABLE
      // --------------------------------------

      const caseTable =
        $("#case-table-body");


      if (caseTable) {

        caseTable.innerHTML =
          data.cases
            .map(
              row => `

                <tr>

                  <td>

                    <div class="case-name">

                      <span
                        class="animal-token ${
                          row[0] === "🐱"
                            ? "cat"
                            : row[0] === "🕊️"
                            ? "bird"
                            : ""
                        }"
                      >
                        ${row[0]}
                      </span>


                      <span>

                        <strong>
                          ${row[1]}
                        </strong>


                        <small>
                          ${row[2]}
                        </small>

                      </span>

                    </div>

                  </td>


                  <td>

                    <span
                      class="status-pill ${row[4]}"
                    >
                      ${row[3]}
                    </span>

                  </td>


                  <td>
                    ${row[5]}
                  </td>


                  <td>
                    ${row[6]}
                  </td>


                  <td>
                    →
                  </td>

                </tr>

              `
            )
            .join("");

      }


      console.log(
        "PawLink dashboard loaded successfully."
      );

    }


    // ------------------------------------------
    // IMPORTANT FIREBASE TIMING
    // ------------------------------------------

    if (
      window.PawLinkAuth &&
      window.PawLinkAuth.user &&
      window.PawLinkAuth.profile
    ) {

      loadDashboard();

    } else {

      console.log(
        "Waiting for Firebase authentication..."
      );


      window.addEventListener(
        "pawlink:auth-ready",
        () => {

          loadDashboard();

        },
        { once: true }
      );

    }


    // ------------------------------------------
    // MOBILE SIDEBAR
    // ------------------------------------------

    const toggle =
      $("[data-dashboard-menu]");


    if (
      toggle &&
      !toggle.dataset.listenerAttached
    ) {

      toggle.dataset.listenerAttached =
        "true";


      toggle.addEventListener(
        "click",
        () => {

          const sidebar =
            $(".dashboard-sidebar");


          if (sidebar) {

            sidebar.classList.toggle(
              "is-open"
            );

          }

        }
      );

    }

  }


  // ==========================================
  // CHATBOT
  // ==========================================

  function setupChatbot() {
  const chat = $("[data-chatbot]");
  const open = $("[data-chat-toggle]");

  if (!chat || !open) return;

  const close = $("[data-chat-close]", chat);
  const form = $("[data-chat-form]", chat);
  const messages = $("[data-chat-messages]", chat);

  if (!form || !messages) return;

  const input = $('[name="question"]', form);

  // --------------------------------------------------
  // PAWLINK CHATBOT KNOWLEDGE BASE
  // --------------------------------------------------

  const knowledgeBase = [
    {
      keywords: ["what is pawlink", "pawlink", "about pawlink"],
      answer:
        "🐾 PawLink is a hyperlocal animal-care coordination platform. It connects citizens, veterinarians, NGOs, shelters, pharmacies and municipal authorities to coordinate animal rescue and care."
    },

    {
      keywords: ["how pawlink works", "how it works", "working"],
      answer:
        "🔄 PawLink works in a simple flow:\n\n1. Citizen reports an animal\n2. Photo and location are added\n3. Case gets a unique ID\n4. Nearby responders are notified\n5. Rescue and treatment are coordinated\n6. Case status is updated\n7. Animal can move to shelter, recovery or adoption."
    },

    {
      keywords: ["report", "report animal", "complaint", "complain"],
      answer:
        "📝 To report an animal:\n\n1. Open the Report Animal section\n2. Add the animal's location\n3. Select the problem\n4. Add a photo if available\n5. Enter useful details\n6. Submit the report.\n\nPawLink will create a case reference number."
    },

    {
      keywords: ["injured animal", "injured dog", "injured cat", "hurt animal"],
      answer:
        "🚑 If you find an injured animal, report it immediately with the exact location, animal condition and a photo if possible. Avoid putting yourself in danger or handling an aggressive or badly injured animal."
    },

    {
      keywords: ["dog", "dogs"],
      answer:
        "🐕 PawLink can be used to report injured, sick, abandoned, stray or vulnerable dogs. Add the location, condition and photo so the appropriate responder can understand the situation."
    },

    {
      keywords: ["cat", "cats"],
      answer:
        "🐈 You can report injured, sick, abandoned or vulnerable cats through PawLink. Providing an accurate location and photo helps the response team."
    },

    {
      keywords: ["bird", "birds"],
      answer:
        "🐦 PawLink can also support reports involving birds and other animals. Provide the location, condition and a photo if it is safe to do so."
    },

    {
      keywords: ["photo", "picture", "image"],
      answer:
        "📷 A photo helps responders understand the animal's condition and identify the situation. However, if taking a photo puts you in danger, skip it and submit the report with the available information."
    },

    {
      keywords: ["location", "gps", "map"],
      answer:
        "📍 Location is important because PawLink is designed for hyperlocal response. The location helps identify nearby vets, NGOs, shelters or other appropriate responders."
    },

    {
      keywords: ["nearby", "near me", "nearest"],
      answer:
        "📍 PawLink uses location information to help connect a case with suitable nearby responders such as vets, NGOs and shelters."
    },

    {
      keywords: ["track", "tracking", "track case"],
      answer:
        "🔎 Every submitted report receives a unique case reference number. You can use the case information to follow progress from reporting to rescue, treatment, shelter, recovery or closure."
    },

    {
      keywords: ["case id", "case number", "reference number"],
      answer:
        "🆔 After submitting a report, PawLink generates a unique case reference such as PL-12345678. Keep this reference to identify and track your case."
    },

    {
      keywords: ["status", "case status"],
      answer:
        "📊 A PawLink case can move through stages such as:\n\nReported → Assigned → Rescue → Treatment → Medicine → Shelter → Recovery → Adoption → Closed."
    },

    {
      keywords: ["rescue", "rescuer"],
      answer:
        "🚑 Once a suitable responder is identified, the case can be assigned for rescue. The responder can then update the case progress."
    },

    {
      keywords: ["vet", "veterinarian", "doctor", "veterinary"],
      answer:
        "🩺 Vets can use PawLink to view relevant animal-care cases, coordinate treatment and update treatment-related information."
    },

    {
      keywords: ["ngo", "ngo role"],
      answer:
        "🤝 NGOs can coordinate rescue activities, support animals, connect with citizens and update case progress through their workspace."
    },

    {
      keywords: ["shelter", "animal shelter"],
      answer:
        "🏠 Shelters can help with temporary accommodation, animal care, recovery and adoption coordination."
    },

    {
      keywords: ["pharmacy", "medicine", "medicines"],
      answer:
        "💊 Pharmacies can support animal-care cases by helping fulfil required medicines and coordinating with the relevant care team."
    },

    {
      keywords: ["authority", "municipal", "government"],
      answer:
        "🏛️ Authorities can use PawLink dashboards to monitor animal-related complaints, rescue activities, vaccination, sterilisation and area-wise response requirements."
    },

    {
      keywords: ["citizen", "citizen role"],
      answer:
        "👤 Citizens can report animals, provide photos and locations, receive case references and follow the progress of their reports."
    },

    {
      keywords: ["dashboard", "workspace"],
      answer:
        "📊 PawLink provides role-based dashboards. Citizens, vets, NGOs, shelters, pharmacies and authorities can see information relevant to their responsibilities."
    },

    {
      keywords: ["role", "different role", "roles"],
      answer:
        "👥 PawLink supports six main roles:\n\n• Citizen\n• Veterinarian\n• NGO\n• Shelter\n• Pharmacy\n• Authority\n\nEach role gets a different workspace."
    },

    {
      keywords: ["login", "sign in", "signin"],
      answer:
        "🔐 Use your registered email address and password to log in. PawLink uses Firebase Authentication for email/password authentication."
    },

    {
      keywords: ["register", "signup", "sign up", "create account"],
      answer:
        "📝 To create an account, enter your name, email, password, city and select your role. After registration, PawLink opens the appropriate dashboard."
    },

    {
      keywords: ["password", "forgot password"],
      answer:
        "🔑 PawLink uses Firebase Authentication for account security. If password-reset functionality is enabled in your project, use the password reset option from the login screen."
    },

    {
      keywords: ["logout", "log out", "sign out"],
      answer:
        "🚪 You can log out using the Logout button in your PawLink dashboard."
    },

    {
      keywords: ["firebase", "authentication"],
      answer:
        "🔥 PawLink uses Firebase Authentication for email/password login and Firestore for storing application data such as user profiles and animal-care cases."
    },

    {
      keywords: ["security", "secure", "safe"],
      answer:
        "🔐 PawLink uses Firebase Authentication and Firestore security rules. Access should be limited according to the user's authenticated account and role."
    },

    {
      keywords: ["privacy", "data", "personal data"],
      answer:
        "🔒 PawLink should collect only the information required for animal-care coordination and protect user and case information through authentication and database security rules."
    },

    {
      keywords: ["emergency", "urgent", "critical"],
      answer:
        "🚨 For an emergency, submit the case with the exact location and animal condition as quickly as possible. Do not put yourself in danger while trying to rescue the animal."
    },

    {
      keywords: ["response time", "how long", "when rescue"],
      answer:
        "⏱️ Response time depends on the animal's condition, location, responder availability and case priority. PawLink helps reduce delays by connecting cases with suitable local responders."
    },

    {
      keywords: ["priority", "urgent case", "high priority"],
      answer:
        "🚨 Cases can be prioritised based on factors such as injury severity, emergency condition and vulnerability. Critical cases should receive faster attention."
    },

    {
      keywords: ["notification", "notifications", "alert", "alerts"],
      answer:
        "🔔 PawLink is designed to notify relevant responders about cases that require their attention. Notifications help reduce delays and missed rescue requests."
    },

    {
      keywords: ["message", "chat", "communication"],
      answer:
        "💬 PawLink can support communication between citizens and care teams so that important case updates are easier to coordinate."
    },

    {
      keywords: ["volunteer", "volunteers"],
      answer:
        "🙋 Volunteers can support animal-care activities depending on the PawLink workflow and the organisations coordinating the case."
    },

    {
      keywords: ["adoption", "adopt", "adopt animal"],
      answer:
        "❤️ After treatment and recovery, eligible animals can move toward adoption. Shelters and partner organisations can coordinate the adoption process."
    },

    {
      keywords: ["vaccination", "vaccine"],
      answer:
        "💉 Authorities and animal-care organisations can use PawLink data to support vaccination planning and monitor vaccination-related activities."
    },

    {
      keywords: ["sterilisation", "sterilization"],
      answer:
        "🐾 PawLink can help authorities and organisations monitor sterilisation activities and understand area-wise requirements."
    },

    {
      keywords: ["lost animal", "missing animal"],
      answer:
        "🔍 Lost-animal information can be coordinated through the PawLink ecosystem. Providing a clear location, description and photo can make identification easier."
    },

    {
      keywords: ["abandoned", "abandoned animal"],
      answer:
        "🏠 If you find an abandoned animal, report its location and condition. PawLink can help coordinate suitable support such as rescue, veterinary care or shelter."
    },

    {
      keywords: ["food", "feeding", "hungry"],
      answer:
        "🍲 If an animal needs food or basic support, you can report the situation and provide its location. For injured or seriously ill animals, veterinary assistance should be prioritised."
    },

    {
      keywords: ["which animals", "animals supported"],
      answer:
        "🐾 PawLink is designed primarily for community animal-care coordination and can support reports involving animals such as dogs, cats and birds, depending on the available responder network."
    },

    {
      keywords: ["cost", "free", "price", "payment"],
      answer:
        "💚 PawLink is designed as a coordination platform. Any veterinary treatment, medicine, shelter or other service may have its own cost depending on the provider."
    },

    {
      keywords: ["fake report", "false report", "fake complaint"],
      answer:
        "⚠️ Users should provide accurate information. A verification and moderation process can help reduce false reports and improve trust in the platform."
    },

    {
      keywords: ["wrong information", "incorrect location"],
      answer:
        "📍 If you accidentally submit incorrect information, contact the responsible care team or administrator and provide the correct details as soon as possible."
    },

    {
      keywords: ["who can use", "users", "use pawlink"],
      answer:
        "👥 PawLink is designed for citizens and animal-care stakeholders including veterinarians, NGOs, shelters, pharmacies and municipal authorities."
    },

    {
      keywords: ["verification", "verified", "verify responder"],
      answer:
        "✅ PawLink can use verification to establish trust among participating vets, NGOs, shelters, pharmacies and authorities before giving them privileged access."
    },

    {
      keywords: ["accountability", "responsibility"],
      answer:
        "📌 PawLink improves accountability by giving cases unique references and allowing progress to be recorded through different stages instead of leaving complaints untracked."
    },

    {
      keywords: ["hyperlocal", "local platform"],
      answer:
        "📍 Hyperlocal means PawLink focuses on connecting an animal-care case with suitable responders in or around the same area, helping reduce response delays."
    },

    {
      keywords: ["unique", "unique feature", "different"],
      answer:
        "⭐ PawLink's key differentiator is coordinated case ownership. Instead of a complaint being sent to only one organisation, the platform connects the relevant stakeholders around the same trackable case."
    },

    {
      keywords: ["existing solution", "other apps", "competitor"],
      answer:
        "🔎 Many existing solutions focus on reporting or individual services. PawLink aims to combine reporting, responder coordination, tracking, treatment, medicine, shelter and authority-level monitoring into one workflow."
    },

    {
      keywords: ["benefits", "advantage", "benefit"],
      answer:
        "✨ Main benefits of PawLink include:\n\n• Faster response\n• Better coordination\n• Case tracking\n• Reduced communication gaps\n• Role-based dashboards\n• Better accountability\n• Area-wise animal-care insights."
    },

    {
      keywords: ["funding", "money", "investment"],
      answer:
        "💰 PawLink could be supported through government programmes, CSR funding, animal-welfare organisations, grants and partnerships with veterinary and municipal networks."
    },

    {
      keywords: ["future", "future plan", "roadmap"],
      answer:
        "🚀 Future improvements can include real-time notifications, verified responder networks, AI-assisted case prioritisation, multilingual support, mobile apps, analytics and integration with local authorities."
    },

    {
      keywords: ["ai", "artificial intelligence"],
      answer:
        "🤖 AI can help PawLink classify animal images, estimate urgency, identify duplicate reports, prioritise cases and provide intelligent assistance. The current chatbot is a lightweight rule-based assistant for the prototype."
    },

    {
      keywords: ["chatbot", "assistant"],
      answer:
        "🤖 I am the PawLink Assistant. I can answer questions about reporting animals, tracking cases, roles, dashboards, rescue, treatment, shelters, authentication and PawLink's overall workflow."
    },

    {
      keywords: ["hello", "hi", "hey", "hii"],
      answer:
        "👋 Hello! Welcome to PawLink. How can I help you today?\n\nYou can ask me about reporting an animal, tracking a case, dashboards, login, rescue or PawLink."
    },

    {
      keywords: ["thank", "thanks", "thank you"],
      answer:
        "😊 You're welcome! I'm always here to help with PawLink."
    },

    {
      keywords: ["bye", "goodbye"],
      answer:
        "👋 Goodbye! Thank you for helping animals with PawLink. 🐾"
    }
  ];

  // --------------------------------------------------
  // ADD MESSAGE
  // --------------------------------------------------

  function addMessage(text, type = "bot") {
    const message = document.createElement("p");

    message.className =
      type === "user" ? "user-message" : "bot-message";

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
  }

  // --------------------------------------------------
  // NORMALIZE TEXT
  // --------------------------------------------------

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // --------------------------------------------------
  // FIND BEST ANSWER
  // --------------------------------------------------

  function findAnswer(question) {
    const q = normalize(question);

    let bestMatch = null;
    let bestScore = 0;

    knowledgeBase.forEach(item => {
      let score = 0;

      item.keywords.forEach(keyword => {
        const key = normalize(keyword);

        if (!key) return;

        // Exact phrase match
        if (q.includes(key)) {
          score += key.split(" ").length * 3;
        }

        // Individual word matching
        const words = key.split(" ");

        words.forEach(word => {
          if (word.length >= 3 && q.includes(word)) {
            score += 1;
          }
        });
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore > 0) {
      return bestMatch.answer;
    }

    return `🤔 I'm not completely sure about that.

I can help you with:

• Reporting an animal
• Injured animals
• Case tracking
• Rescue and treatment
• Vet / NGO / Shelter roles
• Pharmacy and Authority dashboards
• Login and registration
• PawLink features
• AI and chatbot
• Vaccination and sterilisation

Try asking something like:
"How do I report an injured dog?"`;
  }

  // --------------------------------------------------
  // QUICK QUESTIONS
  // --------------------------------------------------

  function addQuickQuestions() {
    if (!input) return;

    const container = document.createElement("div");
    container.className = "quick-questions";

    const questions = [
      "What is PawLink?",
      "How do I report an animal?",
      "How can I track my case?",
      "What if I find an injured dog?",
      "What does the NGO role do?",
      "How does login work?",
      "What are PawLink's benefits?",
      "What makes PawLink unique?"
    ];

    questions.forEach(question => {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = question;

      button.addEventListener("click", () => {
        input.value = question;
        form.requestSubmit();
      });

      container.appendChild(button);
    });

    messages.appendChild(container);
  }

  // --------------------------------------------------
  // SHOW CHAT
  // --------------------------------------------------

  const show = () => {
    chat.hidden = false;
    open.hidden = true;

    if (input) {
      setTimeout(() => input.focus(), 100);
    }

    messages.scrollTop = messages.scrollHeight;
  };

  // --------------------------------------------------
  // HIDE CHAT
  // --------------------------------------------------

  const hide = () => {
    chat.hidden = true;
    open.hidden = false;
  };

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  open.addEventListener("click", show);

  if (close) {
    close.addEventListener("click", hide);
  }

  // --------------------------------------------------
  // FORM SUBMISSION
  // --------------------------------------------------

  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!input) return;

    const question = input.value.trim();

    if (!question) return;

    // User message
    addMessage(question, "user");

    // Clear input
    input.value = "";

    // Small delay to make chatbot feel natural
    setTimeout(() => {
      const answer = findAnswer(question);

      addMessage(answer, "bot");

      messages.scrollTop = messages.scrollHeight;
    }, 350);
  });

  // --------------------------------------------------
  // INITIAL QUICK QUESTIONS
  // --------------------------------------------------

  addQuickQuestions();

  console.log("🐾 PawLink Assistant loaded successfully.");
}



  // ==========================================
  // SIGN OUT
  // ==========================================

  function setupSignOut() {

    document.addEventListener(
      "click",
      async event => {

        const button =
          event.target.closest(
            "[data-sign-out]"
          );


        if (!button) {
          return;
        }


        try {

          button.disabled =
            true;


          button.textContent =
            "Logging out...";


          if (
            window.PawLinkAuth?.signOut
          ) {

            await window.PawLinkAuth.signOut();

          }


          // Firebase session is now cleared
          window.location.replace(
            "index.html"
          );


        } catch (error) {

          console.error(
            "Sign out error:",
            error
          );


          button.disabled =
            false;


          button.textContent =
            "Logout";

        }

      }
    );

  }


  // ==========================================
  // FIREBASE READY
  // ==========================================

  function setupFirebaseReadyListener() {

    window.addEventListener(
      "pawlink:auth-ready",
      () => {

        console.log(
          "PawLink Firebase authentication is ready."
        );

      }
    );

  }


  // ==========================================
  // PAGE INITIALIZATION
  // ==========================================

  function boot() {

    console.log(
      "PawLink application starting..."
    );


    setupModals();

    setupAuthForm();

    setupPhotoPreview();

    setupLocation();

    setupCaseForm();

    setupDashboard();

    setupChatbot();

    setupSignOut();

    setupFirebaseReadyListener();


    console.log(
      "PawLink application ready."
    );

  }


  // ==========================================
  // START
  // ==========================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot
    );

  } else {

    boot();

  }


  // ==========================================
  // PUBLIC UI API
  // ==========================================

  return {

    openModal,

    closeModal

  };

})();


// ==========================================
// GLOBAL PAWLINK UI
// ==========================================

window.PawLinkUI =
  PawLinkUI;