// Handles saving, retrieving, and clearing job entries from chrome.storage.local
const STORATE_KEY = "jobEntries";

/**
 * Get all job entries from chrome storage.
 * @param {function(Array)} callback - Called with job entries array.
 */
function getJobEntries(callback) {
    chrome.storage.local.get(STORATE_KEY, (result) => {
        callback(result[STORATE_KEY] || []);
    });
}

/** 
 * Save a new job entry.
 * @param {Object} jobData - New job entry to save.
 * @param {function=} callback - Optional callback after saving.
 */
function saveJobEntry(jobData, callback = () => {}) {
    chrome.storage.local.get(STORATE_KEY, (result) => {
        const jobs = result[STORATE_KEY] || [];
        jobs.push(jobData)
        chrome.storage.local.set({[STORATE_KEY]:jobs}, () => {
            console.log("Job saved successfully.");
            callback();
        });
    });
}

/**
 * Clear all saved job entries.
 * @param {function=} callback - Optional callback after clearing.
 */
function clearAllJobs(callback = () => {}) {
    chrome.storage.local.remove(STORATE_KEY, () => {
        console.log("All job entries cleared.")
        callback();
    });
}

/**
 * Update a specific job entry by index.
 * @param {number} index - Index of the job to update.
 * @param {Object} updatedData - New data for the job.
 * @param {function=} callback - Optional callback after updating.
 */
function updateJobEntry(index, updatedData, callback = () => {}) {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
        const jobs = result[STORAGE_KEY] || [];
        if (index >= 0 && index < jobs.length) {
            jobs[index] = { ...jobs[index], ...updatedData };
            chrome.storage.local.set({ [STORAGE_KEY]: jobs }, () => {
                console.log(`Job entry at index ${index} updated.`);
                callback();
            });
        } else {
            console.error("Invalid index for job update.");
        }
    });
}

/**
 * Delete a specific job entry by index.
 * @param {number} index - Index of the job to delete.
 * @param {function=} callback - Optional callback after deletion.
 */
function deleteJobEntry(index, callback = () => {}) {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
        const jobs = result[STORAGE_KEY] || [];
        if (index >= 0 && index < jobs.length) {
            jobs.splice(index, 1);
            chrome.storage.local.set({ [STORAGE_KEY]: jobs }, () => {
                console.log(`Job entry at index ${index} deleted.`);
                callback();
            });
        } else {
            console.error("Invalid index for job deletion.");
        }
    });
}

export default {
    saveJobEntry,
    getJobEntries,
    clearAllJobs,
    updateJobEntry,
    deleteJobEntry
}

// module.exports = {
//     saveJobEntry,
//     getJobEntries,
//     clearAllJobs,
//     updateJobEntry,
//     deleteJobEntry
// }