function renderTable() {
    chrome.storage.local.get("jobEntries", (result) => {
        const jobs = result.jobEntries || [];
        const tableBody = document.querySelector("#unitsTable tbody");
        tableBody.innerHTML = "";

        jobs.forEach((job, index) => {
            const applyDate = job.applyDate || "N/A";
            const resumeLink = job.resumeBase64
                ? `<a href="${job.resumeBase64}" download="${job.companyName}_resume.pdf">Download Resume</a>`
                : "No resume";
            const coverLetterLink = job.coverLetterBase64
                ? `<a href="${job.coverLetterBase64}" download="${job.companyName}_coverletter.pdf">Download Cover Letter</a>`
                : "No cover letter";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="editable" data-field="jobTitle">${job.jobTitle || ''}</td>
                <td class="editable" data-field="companyName">${job.companyName || ''}</td>
                <td class="editable" data-field="applyDate">${applyDate}</td>
                <td class="editable" data-field="jobWebsite">${job.jobWebsite || ''}</td>
                <td class="editable" data-field="jobDescription">${job.jobDescription || ''}</td>
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
                } else {
                    cell.innerHTML = `<input class="form-control" value="${value}">`;
                }
            });

            btn.classList.add("d-none");
            row.querySelector(".save-btn").classList.remove("d-none");
        });
    });

    document.querySelectorAll(".save-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            const row = btn.closest("tr");

            row.querySelectorAll(".editable").forEach(cell => {
                const field = cell.dataset.field;
                const input = cell.querySelector("input, textarea");

                if (input) {
                    const value = input.value.trim();
                    jobs[index][field] = value;

                    // Reset cell content
                    cell.textContent = value;
                }
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

document.addEventListener("DOMContentLoaded", renderTable);
