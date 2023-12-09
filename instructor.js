const { MongoClient } = require('mongodb');
const express = require('express');
const path = require('path');
const url = "mongodb://localhost:27017";

const client = new MongoClient(url);

const router = express.Router();
router.use(express.static(path.join(__dirname, 'views')));
router.use(express.json());
router.use(express.urlencoded({ extended: true }))

router.get('/createExam', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'examCreate.html'));
})

router.post('/examInDb', (req, res) => {

    console.log('yes i am exam push center');

    client.connect()
        .then(() => {
            const db = client.db('online_examination_system');

            const collection = db.collection('exams');
            collection.insertOne(req.body)
                .then((result) => {

                })
                .catch(error => console.log(error))
                .finally(() => {
                    client.close();
                })
        })
        .catch(error => {
            console.log(error);
        })
        const htmlContent =
        `
    <!DOCTYPE html>
<html>

<head>
    <title>Successfully Submitted</title>
</head>
<style>
    body{
        background: linear-gradient(to right, #000428, #004e92); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    }
    .popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1;
    }

    .popup-content {
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 5px;
        width: 50%;
        max-width: 400px;
        margin: 10% auto;
        padding: 20px;
        position: relative;
    }

    .close {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
    }
</style>

<body>
    <div id="popup" class="popup">
        <div class="popup-content">
            <span class="close" id="close-popup">&times;</span>
            <h2>You have Successfully Created the Exam.</h2>
        </div>
    </div>

    <script>
        var popup = document.getElementById("popup");
        var closeButton = document.getElementById("close-popup");
        closeButton.addEventListener("click", function () {
            const token = localStorage.getItem('token');
            window.location.href = '/home?token=' + token;
        });
    </script>
</body>
</html>
    `
    res.send(htmlContent);
})

module.exports = router;