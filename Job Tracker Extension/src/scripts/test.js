// imports
// const {saveJobEntry, getJobEntries} = require('./scripts/storage')
// const {fileValidation, clearForm, readFileAsBase64, getElements} = require('./scripts/form.js')
import { saveJobEntry, getJobEntries } from "./storage.js";
import { fileValidation, clearForm, readFileAsBase64, getElements } from "./form.js";

// Ensuring all DOM elements exist and loaded before running inner code
document.addEventListener("DOMContentLoaded", () => {
    // Get elements once
    const elements = getElements();
    elements.resumeInput.addEventListener("change", () => fileValidation(elements.resumeInput));
    elements.coverLetterInput.addEventListener("change", () => fileValidation(elements.coverLetterInput));

    // Event Listeners
    elements.clearBtn.addEventListener("click", () => clearForm(elements));
    elements.downloadBtn.addEventListener("click", () => downloadAllJobs)
    elements.submitBtn.addEventListener("click", () => jobSumbit(elements))
    elements.viewUnitsBtn.addEventListener("click", () => {
        chrome.tabs.create({url: chrome.runtime.getURL("../pages/table/table.html")})
    });

})

async function jobSumbit(elements) {
    const formData = {
        jobTitle: elements.jobTitleInput.value.trim(),
        companyName: elements.companyNameInput.value.trim(),
        jobWebsite: elements.jobWebsiteInput.value.trim(),
        jobDescription: elements.jobDescriptionInput.value.trim(),
        applied: elements.appliedSelect.value.trim(),
        applyDate: new Date().toLocaleString(),
        resumeBase64: await readFileAsBase64(elements.resumeInput),
        coverLetterBase64: await readFileAsBase64(elements.coverLetterInput)
    }

    console.log("sumbit button clicked")

    if (!formData.jobTitle || !formData.companyName) {
        alert("Please fill in Job Title and Company Name.");
        return;
    }

    await saveJobEntry(formData);
    alert("Job Saved!");
    clearForm();

}

// On load, prefill last job
getJobEntries().then(jobs => {
    const lastJob = jobs.at(-1);
    if (!lastJob) return;
    document.getElementById("job-title").value = lastJob.jobTitle || "";
    document.getElementById("company-name").value = lastJob.companyName || "";
    document.getElementById("job-weblink").value = lastJob.jobWebsite || "";
    document.getElementById("job-description").value = lastJob.jobDescription || "";
    document.getElementById("floatingSelect").value = lastJob.applied || "";
});

async function downloadAllJobs() {
    const jobs = await getJobEntries();
    if (!jobs.length) return alert("No jobs saved!");

    const zip = new JSZip();
    zip.file("jobs.json", JSON.stringify(jobs, null, 2));

    jobs.forEach(job => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const folderName = `${job.companyName || "Company"}_${timestamp}`;
        const folder = zip.folder(folderName);

        const csv = `"Job Title","Company Name","Job Description","Job Website","Applied","Apply Date"\n` +
                    `"${job.jobTitle}","${job.companyName}","${job.jobDescription.replace(/"/g, '""')}","${job.jobWebsite}","${job.applied}","${job.applyDate}"`;

        folder.file("job.csv", csv);

        if (job.resumeBase64) {
            folder.file("resume.pdf", job.resumeBase64.split(",")[1], { base64: true });
        }

        if (job.coverLetterBase64) {
            folder.file("cover_letter.pdf", job.coverLetterBase64.split(",")[1], { base64: true });
        }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "job_data.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
}