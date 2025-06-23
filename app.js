
let books = [];
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxOhGeGPOBzpOkN1-ipgGHzy5h_km2M37xQygjoffVEweoMZI501RAwk6DX6TjTLIltTw/exec';
let currentCoverFile = null;
let editingIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  renderBooks();
  document.getElementById('bookForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('cover').addEventListener('change', e => currentCoverFile = e.target.files[0]);
  document.getElementById('searchBox').addEventListener('input', e => renderBooks(e.target.value));
});

function handleFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('bookName').value.trim();
  const author = document.getElementById('author').value.trim();
  const date = new Date().toISOString().split('T')[0];

  if (!currentCoverFile && editingIndex === -1) return alert('Please select a cover image.');

  if (currentCoverFile) {
    compressImage(currentCoverFile, 0.5, base64 => {
      const book = { name, author, date, cover: base64 };
      saveBook(book);
    });
  } else {
    const book = { ...books[editingIndex], name, author };
    books[editingIndex] = book;
    saveBooks();
    syncBook(book);
    resetForm();
  }
}

function saveBook(book) {
  if (editingIndex >= 0) {
    books[editingIndex] = book;
  } else {
    books.push(book);
  }
  saveBooks();
  syncBook(book);
  resetForm();
}

function resetForm() {
  document.getElementById('bookForm').reset();
  currentCoverFile = null;
  editingIndex = -1;
  renderBooks();
}

function renderBooks(filter = '') {
  const list = document.getElementById('bookList');
  const stats = document.getElementById('stats');
  list.innerHTML = '';
  const filtered = books.filter(b =>
    b.name.toLowerCase().includes(filter.toLowerCase()) ||
    b.author.toLowerCase().includes(filter.toLowerCase())
  );
  stats.textContent = `Books: ${filtered.length}, Authors: ${[...new Set(filtered.map(b => b.author))].length}`;

  filtered.forEach((book, i) => {
    const card = document.createElement('div');
    card.className = 'bookCard';
    card.innerHTML = `
      <img src="${book.cover}" alt="Cover">
      <h3>${book.name}</h3>
      <p><strong>Author:</strong> ${book.author}</p>
      <p><strong>Date:</strong> ${book.date}</p>
      <button onclick="editBook(${i})">✏️ Edit</button>
      <button onclick="deleteBook(${i})">🗑️ Delete</button>
    `;
    list.appendChild(card);
  });
}

function editBook(index) {
  const book = books[index];
  document.getElementById('bookName').value = book.name;
  document.getElementById('author').value = book.author;
  editingIndex = index;
}

function deleteBook(index) {
  const book = books.splice(index, 1)[0];
  saveBooks();
  deleteBookFromSheet(book);
  renderBooks();
}

function saveBooks() {
  localStorage.setItem('books', JSON.stringify(books));
}

function loadBooks() {
  books = JSON.parse(localStorage.getItem('books') || '[]');
}

function compressImage(file, quality, callback) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 400, 600);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function syncBook(book) {
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
}

function deleteBookFromSheet(book) {
  // Optional: add deletion sync logic here
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark');
  body.classList.toggle('light');
}

function switchView(mode) {
  const list = document.getElementById('bookList');
  list.className = mode + 'View';
}
