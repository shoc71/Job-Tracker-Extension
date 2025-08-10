document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submitBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const viewUnitsBtn = document.getElementById("viewUnitsBtn");
    const clearBtn = document.getElementById("clearBtn")
    const resumeInput = document.getElementById("resumeUpload");
    const coverLetterInput = document.getElementById("coverLetterUpload");
    const toggleBtn = document.getElementById("toggleDarkModeBtn");
    const body = document.body;

    // checking valid file type
    resumeInput.addEventListener("change", () => fileValidation(resumeInput));
    coverLetterInput.addEventListener("change", () => fileValidation(coverLetterInput));

    // Load initial theme
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    }

    toggleBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
    });

    // // Storing locally on chrome 
    // chrome.storage.local.get("jobEntries", (data) => {
    //     const jobs = data.jobEntries || [];
    //     if (jobs.length > 0) {
    //         const lastJob = jobs[jobs.length - 1];
    //         document.getElementById("job-title").value = lastJob.jobTitle || "";
    //         document.getElementById("company-name").value = lastJob.companyName || "";
    //         document.getElementById("job-weblink").value = lastJob.jobWebsite || "";
    //         document.getElementById("job-description").value = lastJob.jobDescription || "";
    //         document.getElementById("floatingSelect").value = lastJob.applied || "";
    //     }
    // });

    // Upload button opens table.html
    viewUnitsBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("../pages/table/table.html") });
    });

    // Clear button
    clearBtn.addEventListener("click", clearForm);

    // Submit button handler
    submitBtn.addEventListener("click", () => {
        const formData = getFormData();

        if (!formData.jobTitle || !formData.companyName || !formData.jobWebsite || !formData.jobDescription) {
            alert("Please fill in Job Title, Company Name, Website, Job Description.");
            return;
        }

        readFileAsBase64(resumeInput, (resumeBase64) => {
            readFileAsBase64(coverLetterInput, (coverLetterBase64) => {
                formData.resumeBase64 = resumeBase64 || null;
                formData.coverLetterBase64 = coverLetterBase64 || null;

                // Save job entry
                saveToStorage(formData);
                alert("Job saved!");
                clearForm();
            });
        });
    });

    // Download saved jobs + files as zip
    downloadBtn.addEventListener("click", () => {
        chrome.storage.local.get("jobEntries", (result) => {
            const jobs = result.jobEntries || [];

            if (jobs.length === 0) {
                alert("No jobs saved yet!");
                return;
            }

            const zip = new JSZip();

            // JSON File
            zip.file("jobs.json", JSON.stringify(jobs, null, 2));

            // CSV + Files
            jobs.forEach((job, index) => {
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, "-");
                const folderName = `${job.companyName || "Company"}_${timestamp}`;
                const folder = zip.folder(folderName);

                const csvContent =
                    `Job Title,Company Name,Job Description,Job Website,Applied?,Apply Date\n` +
                    `"${job.jobTitle}","${job.companyName}","${job.jobDescription.replace(/"/g, '""')}","${job.jobWebsite}","${job.applied}",${job.applyDate}`;

                folder.file("job.csv", csvContent);

                if (job.resumeBase64) {
                    const resumeData = job.resumeBase64.split(",")[1];
                    const resumeFileName = `${job.companyName}_${timestamp}_resume.pdf`.replace(/\s+/g, "_");
                    folder.file(resumeFileName, resumeData, {base64: true});
                }

                if (job.coverLetterBase64) {
                    const coverData = job.coverLetterBase64.split(",")[1];
                    const coverFileName = `${job.companyName}_${timestamp}_cv.pdf`.replace(/\s+/g, "_");
                    folder.file(coverFileName, coverData, {base64: true});
                }
            });

            zip.generateAsync({ type: "blob" }).then(content => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(content);
                a.download = "job_data.zip";
                document.body.appendChild(a); // Required for Firefox
                a.click();
            });
        });
    });
});

// Extract form data
function getFormData() {
    return {
        jobTitle: document.getElementById("job-title").value,
        companyName: document.getElementById("company-name").value,
        jobWebsite: document.getElementById("job-weblink").value,
        jobDescription: document.getElementById("job-description").value,
        applied: document.getElementById("floatingSelect").value,
        applyDate: new Date().toLocaleString(), // save readable timestamp
    };
}

// Reads file into base64
function readFileAsBase64(input, callback) {
    const file = input.files[0];
    if (!file) return callback(null);

    const allowedExtensions = /\.(doc|docx|pdf)$/i;
    if (!allowedExtensions.exec(file.name)) {
        alert('Invalid file type. Allowed: DOC, DOCX, PDF');
        callback(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(reader.result); // base64 data URL
    reader.onerror = () => {
        console.error('Error reading file:', reader.error)
        callback(null)
    };

    reader.readAsDataURL(file);
}

// Clear form after submit
function clearForm() {
    const jobTitleInput = document.getElementById("job-title");
    const companyNameInput = document.getElementById("company-name");
    const jobWebLinkInput = document.getElementById("job-weblink");
    const jobDescriptionInput = document.getElementById("job-description");
    const appliedSelect = document.getElementById("floatingSelect");
    const resumeInput = document.getElementById("resumeUpload");
    const coverLetterInput = document.getElementById("coverLetterUpload");

    if (jobTitleInput) jobTitleInput.value = "";
    if (companyNameInput) companyNameInput.value = "";
    if (jobWebLinkInput) jobWebLinkInput.value = "";
    if (jobDescriptionInput) jobDescriptionInput.value = "";
    if (appliedSelect) appliedSelect.selectedIndex = 0;
    if (resumeInput) resumeInput.value = "";
    if (coverLetterInput) coverLetterInput.value = "";
}

// Save job entry to storage
function saveToStorage(data) {
    chrome.storage.local.get("jobEntries", (result) => {
        const jobs = result.jobEntries || [];
        jobs.push(data);
        chrome.storage.local.set({ jobEntries: jobs }, () => {
            console.log("Job saved to sync storage");
        });
    });
}

// File Validation (Resume & CV)
function fileValidation(userInput) {
    var file = userInput.files[0];
    if (!file) return;

    const allowedExtensions = /\.(doc|docx|pdf)$/i;
    if (!allowedExtensions.exec(file.name)) {
        alert('Invalid file type. Allowed: DOC, DOCX, PDF');
        // callback(null);
        userInput.value = ""
    }
}