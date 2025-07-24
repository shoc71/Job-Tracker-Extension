const submitBtn = document.getElementById("submitBtn");
const downloadBtn = document.getElementById("downloadBtn");
const uploadBtn = document.getElementById("uploadFilesBtn");
const clearBtn = document.getElementById("clearBtn")
const resumeInput = document.getElementById("resumeUpload");
const coverLetterInput = document.getElementById("coverLetterUpload");

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleDarkModeBtn");
    const body = document.body;

    // Load initial theme
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    }

    toggleBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
    });
});


document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("jobEntries", (data) => {
        const jobs = data.jobEntries || [];
        if (jobs.length > 0) {
            const lastJob = jobs[jobs.length - 1];
            document.getElementById("job-title").value = lastJob.jobTitle || "";
            document.getElementById("company-name").value = lastJob.companyName || "";
            document.getElementById("job-weblink").value = lastJob.jobWebsite || "";
            document.getElementById("job-description").value = lastJob.jobDescription || "";
            document.getElementById("floatingSelect").value = lastJob.applied || "";
        }
    });
});

// Upload button opens table.html
uploadBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("table.html") });
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

// Reads file into blob
function readFileAsBase64(input, callback) {
    const file = input.files[0];
    if (!file) return callback(null);
    const reader = new FileReader();
    reader.onload = () => callback(reader.result); // base64 data URL
    reader.readAsDataURL(file);
}

// Clear form after submit
function clearForm() {
    document.getElementById("job-title").value = "";
    document.getElementById("company-name").value = "";
    document.getElementById("job-weblink").value = "";
    document.getElementById("job-description").value = "";
    document.getElementById("floatingSelect").selectedIndex = 0;
    resumeInput.value = "";
    coverLetterInput.value = "";
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

// Clear button
clearBtn.addEventListener("click", clearForm);

// Submit button handler
submitBtn.addEventListener("click", () => {
    const formData = getFormData();

    if (!formData.jobTitle || !formData.companyName) {
        alert("Please fill in Job Title and Company Name.");
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
