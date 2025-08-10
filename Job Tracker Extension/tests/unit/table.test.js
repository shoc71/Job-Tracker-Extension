/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../../pages/table/table.html'), 'utf8');

describe('table.html', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    require('../../pages/table/table.js');
  });

  test('renders table structure', () => {
    const table = document.getElementById('unitsTable');
    expect(table).toBeInTheDocument();
    expect(table.querySelector('tbody')).toBeInTheDocument();
  });

  test('dark mode toggle exists', () => {
    const toggleBtn = document.getElementById('darkModeToggle');
    expect(toggleBtn).toBeInTheDocument();
  });
});
