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
                    <button class="btn btn-sm btn-info download-row-btn" data-index="${index}">ZIP Download</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachButtonListeners(jobs);
    });
}

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

// darkmode
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

document.addEventListener("DOMContentLoaded", renderTable);