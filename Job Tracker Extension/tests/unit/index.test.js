/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

describe('index.html', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        require('../../src/index.js'); // load test script
    });

    test('loads job title input and buttons', () => {
        const jobTitleInput = document.getElementById('job-title');
        const submitBtn = document.getElementById('submitBtn');
        expect(jobTitleInput).toBeInTheDocument();
        expect(submitBtn).toBeInTheDocument();
    });

    test('clears form on clearBtn click', () => {
        const jobTitleInput = document.getElementById('job-title');
        const clearBtn = document.getElementById('clearBtn');
        jobTitleInput.value = 'Test Job';
        clearBtn.click();
        expect(jobTitleInput.value).toBe('');
    })
});

