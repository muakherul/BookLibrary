
let books = JSON.parse(localStorage.getItem('books') || '[]');
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxOhGeGPOBzpOkN1-ipgGHzy5h_km2M37xQygjoffVEweoMZI501RAwk6DX6TjTLIltTw/exec';

function renderBooks(filter = '') {
    const bookList = document.getElementById('bookList');
    const stats = document.getElementById('stats');
    bookList.innerHTML = '';
    const filtered = books.filter(b => b.name.toLowerCase().includes(filter) || b.author.toLowerCase().includes(filter));
    stats.textContent = `Total Books: ${filtered.length}, Authors: ${[...new Set(filtered.map(b => b.author))].length}`;
    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'bookCard';
        card.innerHTML = `
            <img src="${book.cover}" alt="Cover">
            <h3>${book.name}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Date:</strong> ${book.date}</p>
        `;
        bookList.appendChild(card);
    });
}

document.getElementById('bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('bookName').value.trim();
    const author = document.getElementById('author').value.trim();
    const file = document.getElementById('cover').files[0];
    const date = new Date().toISOString().split('T')[0];
    if (!file) return alert('Please select a cover image.');

    const reader = new FileReader();
    reader.onload = function(event) {
        books.push({ name, author, date, cover: event.target.result });
        localStorage.setItem('books', JSON.stringify(books));
        renderBooks();
        document.getElementById('bookForm').reset();
    };
    reader.readAsDataURL(file);
});

document.getElementById('searchBox').addEventListener('input', e => {
    renderBooks(e.target.value.toLowerCase());
});

function exportToCSV() {
    const csv = ['Name,Author,Date,Cover (base64)'];
    books.forEach(b => {
        csv.push(`${b.name},${b.author},${b.date},${b.cover}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_library_export.csv';
    a.click();
}

function syncToGoogleSheet() {
    if (!SHEET_URL.includes('https://script.google.com/macros/s/AKfycbxOhGeGPOBzpOkN1-ipgGHzy5h_km2M37xQygjoffVEweoMZI501RAwk6DX6TjTLIltTw/exec')) {
        books.forEach(book => {
            fetch(SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
        });
        alert("🔄 Sync triggered. Check your Google Sheet in a few seconds.");
    } else {
        alert("❌ Please update SHEET_URL with your Google Apps Script URL.");
    }
}

renderBooks();
