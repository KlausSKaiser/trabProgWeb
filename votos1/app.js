const express = require('express');
const fs = require('fs');
const session = require('express-session');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.get('/', (req, res) => {
    const candidatesData = getCandidatesData();

    res.render('index', { candidates: candidatesData });
});

app.post('/vote', (req, res) => {
    const candidateId = req.body.candidateId;
    const studentId = req.body.studentId;

    const votesData = getVotesData();
    if (votesData[studentId]) {
        res.render('error', { message: 'Você já votou.' });
        return;
    }

    if (!isValidStudentId(studentId)) {
        res.render('error', { message: 'Número de matrícula inválido.' });
        return;
    }

    votesData[studentId] = candidateId;
    saveVotesData(votesData);

    res.render('success');
});

app.get('/admin', requireAuth, (req, res) => {
        if (req.session.authenticated) {

                const candidatesData = getCandidatesData();

                const votesData = getVotesData();

                const voteCounts = {};
                Object.values(votesData).forEach((candidateId) => {
                    if (voteCounts[candidateId]) {
                        voteCounts[candidateId]++;
                    } else {
                        voteCounts[candidateId] = 1;
                    }
                });

                res.render('admin', { candidates: candidatesData, voteCounts: voteCounts });


        } else {
            res.redirect('/login');
        }
    });

    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.post('/login', (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        if (username === 'admin' && password === '4321dcba') {
            req.session.authenticated = true;
            res.redirect('/admin');
        } else {
            res.render('error', { message: 'Credenciais inválidas.' });
        }
    });

    app.get('/logout', (req, res) => {
        req.session.authenticated = false;
        res.redirect('/login');
});

app.post('/admin/addCandidate', requireAuth, (req, res) => {

    const candidate = {
        id: req.body.id,
        name: req.body.name,
    };

    const candidatesData = getCandidatesData();

    candidatesData.push(candidate);

    saveCandidatesData(candidatesData);

    res.redirect('/admin');
});

app.post('/admin/editCandidate', requireAuth, (req, res) => {

    const candidateId = req.body.candidateId;

    const candidatesData = getCandidatesData();

    const candidate = candidatesData.find((c) => c.id === candidateId);
    if (!candidate) {
        res.render('error', { message: 'Candidato não encontrado.' });
        return;
    }

    candidate.name = req.body.name;

    saveCandidatesData(candidatesData);

    res.redirect('/admin');
});

app.post('/admin/removeCandidate', requireAuth, (req, res) => {

    const candidateId = req.body.candidateId;

    let candidatesData = getCandidatesData();

    const candidateIndex = candidatesData.findIndex((c) => c.id === candidateId);
    if (candidateIndex === -1) {
        res.render('error', { message: 'Candidato não encontrado.' });
        return;
    }

    candidatesData.splice(candidateIndex, 1);

    saveCandidatesData(candidatesData);

    res.redirect('/admin');
});



app.post('/admin/resetVotes', requireAuth, (req, res) => {

    const votesData = {};
    saveVotesData(votesData);

    res.redirect('/admin');
});

app.post('/admin/resetCandidates', requireAuth, (req, res) => {

    const candidatesData = [];
    saveCandidatesData(candidatesData);

    const votesData = {};
    saveVotesData(votesData);

    res.redirect('/admin');
});

const candidatesData = getCandidatesData();

const votesData = getVotesData();

const voteCounts = {};
Object.values(votesData).forEach((candidateId) => {
    if (voteCounts[candidateId]) {
        voteCounts[candidateId]++;
    } else {
        voteCounts[candidateId] = 1;
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === 'admin' && password === '4321dcba') {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.render('error', { message: 'Credenciais inválidas.' });
    }
});

app.listen(port, () => {
    console.log(`Server rodando na porta ${port}`);
});

function getCandidatesData() {
    return JSON.parse(fs.readFileSync('candidates.json'));
}

function getVotesData() {
    try {
        return JSON.parse(fs.readFileSync('votes.json'));
    } catch (error) {
        return {};
    }
}

function saveVotesData(votesData) {
    fs.writeFileSync('votes.json', JSON.stringify(votesData, null, 2));
}

function saveCandidatesData(candidatesData) {
    fs.writeFileSync('candidates.json', JSON.stringify(candidatesData, null, 2));
}

function isValidStudentId(studentId) {
    const regex = /^080\d{5}$/;
    return regex.test(studentId);
}