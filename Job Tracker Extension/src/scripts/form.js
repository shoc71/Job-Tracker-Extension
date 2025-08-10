function getElements() {
    return {
        jobTitleInput: document.getElementById("job-title"),
        companyNameInput: document.getElementById("company-name"),
        jobWebsiteInput: document.getElementById("job-weblink"),
        jobDescriptionInput: document.getElementById("job-description"),
        appliedSelect: document.getElementById("floatingSelect"),
        resumeInput: document.getElementById("resumeUpload"),
        coverLetterInput: document.getElementById("coverLetterUpload"),
        submitBtn: document.getElementById("submitBtn"),
        clearBtn: document.getElementById("clearBtn"),
        downloadBtn: document.getElementById("downloadBtn"),
        viewUnitsBtn: document.getElementById("viewUnitsBtn"),
        toggleBtn: document.getElementById("toggleDarkModeBtn")
    };
}

function clearForm(elements) {
    elements.jobTitleInput.value = "";
    elements.companyNameInput.value = "";
    elements.jobWebsiteInput.value = "";
    elements.jobDescriptionInput.value = "";
    elements.appliedSelect.selectedIndex = 0;
    elements.resumeInput.value = "";
    elements.coverLetterInput.value = "";
}

function fileValidation(input) {
    const file = input.files[0];
    const allowedExtensions = /\.(doc|docx|pdf)$/i;

    if (!file) return;
    if(!allowedExtensions.exec(file.name)) {
        alert('Invalid file type. Allowed: DOC, DOCX, PDF');
        input.value = "";
    }
}

function readFileAsBase64(input) {
    return new Promise((resolve) => {
        const file = input.files[0];
        if (!file) return resolve(null);

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => {
            console.error('Error reading file:', reader.error);
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
}

export default { 
    getElements, 
    readFileAsBase64, 
    clearForm, 
    fileValidation
}

// module.exports = {
//     getElements,
//     readFileAsBase64,
//     clearForm,
//     fileValidation
// }