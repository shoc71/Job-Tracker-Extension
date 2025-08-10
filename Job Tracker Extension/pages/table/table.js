const exportAllBtn = document.getElementById("exportAllBtn");
const importAllBtn = document.getElementById("importAllBtn");
const importAllInput = document.getElementById("importAllInput");
const checkDuplicatesBtn = document.getElementById("dupJobsCheck")

function renderTable() {
    chrome.storage.local.get("jobEntries", (result) => {
        const jobs = result.jobEntries || [];
        const tableBody = document.querySelector("#unitsTable tbody");
        tableBody.innerHTML = "";

        jobs.forEach((job, index) => {
            const applyDate = job.applyDate || "N/A";
            const webLink = job.jobWebsite 
                ? `<a href="${job.jobWebsite || "#"}" target="_blank">${job.jobTitle} ${job.companyName} (Job Link)</a>`
                : 'No website provided'
            const resumeLink = job.resumeBase64
                ? `<a href="${job.resumeBase64}" download="${applyDate}_${job.jobTitle}_${job.companyName}_resume.pdf">${job.jobTitle} ${job.companyName} (Resume)</a>`
                : "No resume";
            const coverLetterLink = job.coverLetterBase64
                ? `<a href="${job.coverLetterBase64}" download="${applyDate}_${job.jobTitle}_${job.companyName}_coverletter.pdf">${job.jobTitle} ${job.companyName} (CV)</a>`
                : "No cover letter";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="editable" data-field="jobTitle">${job.jobTitle || ''}</td>
                <td class="editable" data-field="companyName">${job.companyName || ''}</td>
                <td class="editable" data-field="applyDate">${applyDate}</td>
                <td class="editable" data-field="jobWebsite">${webLink}</td>
                <td class="editable" data-field="jobDescription">
                    <div class="job-desc-preview" style="max-height: 60px; overflow: hidden; position: relative;">
                        <span>${job.jobDescription || ''}</span>
                        <button class="btn btn-sm btn-link toggle-desc">Show More</button>
                    </div>
                </td>
                <td>${resumeLink}</td>
                <td>${coverLetterLink}</td>
                <td class="editable" data-field="applied">${job.applied || ''}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-index="${index}">Edit</button>
                    <button class="btn btn-sm btn-success save-btn d-none" data-index="${index}">Save</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">Delete</button>
                    <button class="btn btn-sm btn-info download-row-btn" data-index="${index}">Download</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachButtonListeners(jobs);
    });
}

// -------------------------------------- Editing Button Actions
function attachButtonListeners(jobs) {
    document.querySelectorAll(".toggle-desc").forEach(btn => {
        btn.addEventListener("click", () => {
            const wrapper = btn.closest(".job-desc-preview");
            wrapper.classList.toggle("expanded");

            if (wrapper.classList.contains("expanded")) {
                wrapper.style.maxHeight = "none";
                btn.textContent = "Show Less";
            } else {
                wrapper.style.maxHeight = "60px";
                btn.textContent = "Show More";
            }
        });
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.index);
            jobs.splice(index, 1);
            chrome.storage.local.set({ jobEntries: jobs }, renderTable);
        });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const row = btn.closest("tr");
            row.querySelectorAll(".editable").forEach(cell => {
                const field = cell.dataset.field;
                const value = cell.textContent.trim();

                if (field === "jobDescription") {
                    cell.innerHTML = `<textarea class="form-control" rows="4">${value}</textarea>`;

                } else if (field === "jobWebsite") {
                    const href = cell.querySelector("a")?.getAttribute("href") || value;
                    cell.innerHTML = `<input class="form-control" value="${href}">`;

                } else if (field === "applied") {
                    const currentValue = cell.textContent.trim();
                    cell.innerHTML = `
                        <select class="form-select form-select-sm">
                            <option value="Yes" ${currentValue === "Yes" ? "selected" : ""}>Yes</option>
                            <option value="No" ${currentValue === "No" ? "selected" : ""}>No</option>
                            <option value="INF" ${currentValue === "INF" ? "selected" : ""}>INF</option>
                            <option value="Pending" ${currentValue === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="Rejected" ${currentValue === "Rejected" ? "selected" : ""}>Rejected</option>
                            <option value="HR-Call" ${currentValue === "HR-Call" ? "selected" : ""}>HR-Call</option>
                            <option value="Interview" ${currentValue === "Interview" ? "selected" : ""}>Interview</option>
                            <option value="Offer" ${currentValue === "Offer" ? "selected" : ""}>Offer</option>
                            <option value="Hired" ${currentValue === "Hired" ? "selected" : ""}>Hired</option>
                        </select>`;

                } else {
                    cell.innerHTML = `<input class="form-control" value="${value}">`;
                }
            });

            // Replace resume and cover letter cells with file inputs
            const resumeCell = row.children[6];
            const coverLetterCell = row.children[7];

            resumeCell.innerHTML = `
                <input type="file" class="form-control form-control-sm resume-input" accept="application/pdf">
            `;

            coverLetterCell.innerHTML = `
                <input type="file" class="form-control form-control-sm coverletter-input" accept="application/pdf">
            `;

            btn.classList.add("d-none");
            row.querySelector(".save-btn").classList.remove("d-none");
        });
    });

    document.querySelectorAll(".save-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            const row = btn.closest("tr");

            row.querySelectorAll(".editable").forEach(cell => {
                const resumeInput = row.querySelector(".resume-input");
                const coverInput = row.querySelector(".coverletter-input");
                const field = cell.dataset.field;
                let value;

                if (field === "applied") {
                    const select = cell.querySelector("select");
                    value = select.value;
                    jobs[index][field] = value;
                    cell.textContent = value;
                } else {
                    const input = cell.querySelector("input, textarea");
                    if (input) {
                        const value = input.value.trim();
                        jobs[index][field] = value;

                        
                        if (field === "jobWebsite") {
                            jobs[index][field] = value;
                            const jobTitle = jobs[index].jobTitle || "Job Link";
                            cell.innerHTML = `<a href="${value}" target="_blank">${jobTitle} (Job Link)</a>`;
                        } else if (field === "jobDescription") {
                            jobs[index][field] = value;
                            cell.innerHTML = `
                                <div class="job-desc-preview" style="max-height: 60px; overflow: hidden; position: relative;">
                                    <span>${value}</span>
                                    <button class="btn btn-sm btn-link toggle-desc">Show More</button>
                                </div>`;
                        } else {
                            jobs[index][field] = value;
                            cell.textContent = value;
                        }
                    }
                }

                // Resume and Cover-Letter saving logic
                const saveFile = (fileInput) => {
                    return new Promise((resolve) => {
                        if (fileInput && fileInput.files.length > 0) {
                            const reader = new FileReader();
                            reader.onload = function () {
                                resolve(reader.result);
                            };
                            reader.readAsDataURL(fileInput.files[0]);
                        } else {
                            resolve(null);
                        }
                    });
                };

                Promise.all([
                    saveFile(resumeInput),
                    saveFile(coverInput)
                ]).then(([resumeData, coverData]) => {
                    if (resumeData) {
                        jobs[index].resumeBase64 = resumeData;
                    }
                    if (coverData) {
                        jobs[index].coverLetterBase64 = coverData;
                    }

                    chrome.storage.local.set({ jobEntries: jobs }, renderTable);
                });
            });

            chrome.storage.local.set({ jobEntries: jobs }, () => {
                btn.classList.add("d-none");
                row.querySelector(".edit-btn").classList.remove("d-none");
            });
        });
    });

    document.querySelectorAll(".download-row-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            const job = jobs[index];
            const zip = new JSZip();

            const csvContent = `Job Title,Company Name,Job Description,Job Website,Applied?,Apply Date\n"${job.jobTitle}","${job.companyName}","${(job.jobDescription || "").replace(/"/g, '""')}","${job.jobWebsite}","${job.applied}","${job.applyDate}"`;
            zip.file("summary.csv", csvContent);

            if (job.resumeBase64) {
                const base64 = job.resumeBase64.split(",")[1];
                zip.file("resume.pdf", base64, { base64: true });
            }

            if (job.coverLetterBase64) {
                const base64 = job.coverLetterBase64.split(",")[1];
                zip.file("cover_letter.pdf", base64, { base64: true });
            }

            zip.generateAsync({ type: "blob" }).then(content => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(content);
                a.download = `${job.companyName.replace(/\s+/g, "_")}_application.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            });
        });
    });
}

// --------------------------------------- Darkmode
const toggleBtn = document.getElementById("darkModeToggle");

    const body = document.body;

    // Load initial theme
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
        toggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// --------------------------------------- Export, Import, Duplicate Check
exportAllBtn.addEventListener("click", () => {
    chrome.storage.local.get("jobEntries", (result) => {
        const jobs = result.jobEntries || [];
        if (jobs.length === 0) {
            alert("No jobs to export.");
            return;
        }

        const zip = new JSZip();
        zip.file("jobs.json", JSON.stringify(jobs, null, 2));

        jobs.forEach((job, i) => {
            // const now = new Date();
            // const folderName = `Job_${i + 1}_${job.companyName || "Company"}_${job.applyDate}`;
            const folder = zip.folder(`Job_${i + 1}_${job.companyName || "Company"}`);
            // const folder = zip.folder(folderName);

            const csvContent =
                `Job Title,Company Name,Job Description,Job Website,Applied?,Apply Date\n` +
                `"${job.jobTitle}","${job.companyName}","${job.jobDescription.replace(/"/g, '""')}","${job.jobWebsite}","${job.applied}",${job.applyDate}`;

            folder.file("job.csv", csvContent);

            folder.file("job.json", JSON.stringify(job, null, 2));

            if (job.resumeBase64) {
                const base64 = job.resumeBase64.split(",")[1];
                folder.file("resume.pdf", base64, { base64: true });
            }

            if (job.coverLetterBase64) {
                const base64 = job.coverLetterBase64.split(",")[1];
                folder.file("cover_letter.pdf", base64, { base64: true });
            }
        });

        zip.generateAsync({ type: "blob" }).then(blob => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "job_entries_export.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    });
});

importAllBtn.addEventListener("click", () => {
    importAllInput.click(); // Open file picker
});

importAllInput.addEventListener("change", () => {
    const file = importAllInput.files[0];
    if (!file) return;

    if (file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const importedJobs = JSON.parse(reader.result);
                if (!Array.isArray(importedJobs)) throw new Error("Invalid JSON format");

                mergeJobEntries(importedJobs);
            } catch (e) {
                alert("Failed to import JSON: " + e.message);
            }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith(".zip")) {
        const zip = new JSZip();
        zip.loadAsync(file).then(zipContent => {
            return zipContent.file("jobs.json").async("string");
        }).then(jsonData => {
            const importedJobs = JSON.parse(jsonData);
            mergeJobEntries(importedJobs);
        }).catch(err => {
            alert("Failed to import ZIP: " + err.message);
        });
    } else {
        alert("Unsupported file type.");
    }
});

checkDuplicatesBtn.addEventListener("click", highlightDuplicates)

function mergeJobEntries(importedJobs) {
    chrome.storage.local.get("jobEntries", (result) => {
        const currentJobs = result.jobEntries || [];
        const mergedJobs = currentJobs.concat(importedJobs);
        chrome.storage.local.set({ jobEntries: mergedJobs }, () => {
            alert(`Imported ${importedJobs.length} job(s).`);
            renderTable();
        });
    });
}

function highlightDuplicates () {
    chrome.storage.local.get("jobEntries", (result) => {
        const jobs = result.jobEntries || [];
        const seen = new Map();
        const duplicateIndices = new Set();

        jobs.forEach((job, index) => {
            const key = (job.jobWebsite || "") + "|" + (job.jobDescription || + "");
            if (seen.has(key)) {
                duplicateIndices.add(index);
                // duplicateIndices.add(seen.get(key))
            } else {
                seen.set(key, index);
            }
        });

        // Mutiple Delete Check
        const numDuplciates = duplicateIndices.size;
        if (numDuplciates) {
            const confirmDelete = confirm(`Found ${numDuplciates} duplicate entries.\nDo you want to delete them?`);
            if (confirmDelete) {
                const filteredJobs = jobs.filter((_, idx) => !duplicateIndices.has(idx));

                chrome.storage.local.set({ jobEntries: filteredJobs }, () => {
                    alert("Duplicates deleted.");
                    window.location.reload(); // Refresh table display
                });
            }
        }

        const tableRows = document.querySelectorAll("#unitsTable tbody tr");
        tableRows.forEach((row, index) => {
            row.classList.remove("duplicate-row"); // reset
            if (duplicateIndices.has(index)) {
                row.classList.add("duplicate-row");
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", renderTable);