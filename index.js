const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Mock book data and user data (In real applications, use a database)
const bookList = [
    { isbn: '12345', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', reviews: [] },
    { isbn: '23456', title: 'To Kill a Mockingbird', author: 'Harper Lee', reviews: [] },
    { isbn: '34567', title: '1984', author: 'George Orwell', reviews: [] },
    { isbn: '45678', title: 'Pride and Prejudice', author: 'Jane Austen', reviews: [] },
    { isbn: '56789', title: 'The Catcher in the Rye', author: 'J.D. Salinger', reviews: [] },
    { isbn: '67890', title: 'The Hobbit', author: 'J.R.R. Tolkien', reviews: [] },
    { isbn: '78901', title: 'Moby Dick', author: 'Herman Melville', reviews: [] },
    { isbn: '89012', title: 'War and Peace', author: 'Leo Tolstoy', reviews: [] },
    { isbn: '90123', title: 'The Odyssey', author: 'Homer', reviews: [] },
    { isbn: '01234', title: 'Ulysses', author: 'James Joyce', reviews: [] },
    { isbn: '11234', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', reviews: [] },
    { isbn: '12234', title: 'The Iliad', author: 'Homer', reviews: [] },
    { isbn: '13234', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', reviews: [] },
    { isbn: '14234', title: 'Anna Karenina', author: 'Leo Tolstoy', reviews: [] },
    { isbn: '15234', title: 'Brave New World', author: 'Aldous Huxley', reviews: [] },
    { isbn: '16234', title: 'Wuthering Heights', author: 'Emily Brontë', reviews: [] },
    { isbn: '17234', title: 'The Divine Comedy', author: 'Dante Alighieri', reviews: [] },
    { isbn: '18234', title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', reviews: [] },
    { isbn: '19234', title: 'The Sound and the Fury', author: 'William Faulkner', reviews: [] },
    { isbn: '20234', title: 'Madame Bovary', author: 'Gustave Flaubert', reviews: [] }
];

const users = [];

// Secret key for JWT
const SECRET_KEY = 'secretKey';

// Middleware to authenticate users using JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Task 1: Get all books
app.get('/books', async (req, res) => {
    try {
        res.json(bookList);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Task 2: Get book by ISBN
app.get('/books/:isbn', (req, res) => {
    const { isbn } = req.params;
    const book = bookList.find(b => b.isbn === isbn);
    book ? res.json(book) : res.status(404).send('Book not found');
});

// Task 3: Get books by author
app.get('/books/author/:name', (req, res) => {
    const { name } = req.params;
    const books = bookList.filter(book => book.author.toLowerCase() === name.toLowerCase());
    res.json(books);
});

// Task 4: Get books by title
app.get('/books/title/:title', (req, res) => {
    const { title } = req.params;
    const books = bookList.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
    res.json(books);
});

// Task 5: Get reviews for a book by ISBN
app.get('/books/:isbn/reviews', (req, res) => {
    const { isbn } = req.params;
    const book = bookList.find(b => b.isbn === isbn);
    book ? res.json(book.reviews) : res.status(404).send('No reviews found for this book');
});

// Task 6: Register new user
app.post('/users/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate that both username and password are provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        // Use bcrypt.hash with 10 salt rounds (a standard value)
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { username, password: hashedPassword };
        users.push(user);
        res.status(201).send('User registered');
    } catch (err) {
        res.status(500).send('Error registering user');
    }
});


// Task 7: Login as a registered user
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Task 8: Add/Modify a book review (logged in users only)
app.post('/books/:isbn/reviews', authenticateToken, (req, res) => {
    const { isbn } = req.params;
    const { review } = req.body;
    const book = bookList.find(b => b.isbn === isbn);

    if (!book) return res.status(404).send('Book not found');
    
    book.reviews.push({ username: req.user.username, review });
    res.status(201).send('Review added');
});

// Task 9: Delete a book review (logged in users only)
app.delete('/books/:isbn/reviews', authenticateToken, (req, res) => {
    const { isbn } = req.params;
    const book = bookList.find(b => b.isbn === isbn);

    if (!book) return res.status(404).send('Book not found');

    const reviewIndex = book.reviews.findIndex(r => r.username === req.user.username);

    if (reviewIndex === -1) return res.status(403).send('You can only delete your own reviews');

    book.reviews.splice(reviewIndex, 1);
    res.send('Review deleted');
});

// Task 10: Get all books using async callback
app.get('/books/async', async (req, res) => {
    try {
        const books = await new Promise((resolve) => setTimeout(() => resolve(bookList), 500));
        res.json(books);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Task 11: Search by ISBN using Promises
app.get('/books/isbn/:isbn', (req, res) => {
    new Promise((resolve, reject) => {
        const book = bookList.find(b => b.isbn === req.params.isbn);
        book ? resolve(book) : reject('Book not found');
    })
    .then(book => res.json(book))
    .catch(err => res.status(404).send(err));
});

// Task 12: Search by Author using Async/Await
app.get('/books/async/author/:name', async (req, res) => {
    try {
        const books = await new Promise((resolve) => {
            const result = bookList.filter(b => b.author.toLowerCase() === req.params.name.toLowerCase());
            resolve(result);
        });
        res.json(books);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Task 13: Search by Title using Promises
app.get('/books/title/promises/:title', (req, res) => {
    new Promise((resolve, reject) => {
        const books = bookList.filter(b => b.title.toLowerCase().includes(req.params.title.toLowerCase()));
        books.length ? resolve(books) : reject('No books found');
    })
    .then(books => res.json(books))
    .catch(err => res.status(404).send(err));
});

// Task 14: Submission - GitHub link submission is outside the scope of this file

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
