const express = require('express')
const router = require('express').Router();
let Subscriber = require('../models/subscriber.model')
const Authenticate = require('./middleware');
const fs = require('fs');
const xlsx = require('xlsx');
router.use(express.urlencoded({
    extended: true
}))

router.route('/').get(Authenticate, (req, res) => {
    Subscriber.find().then(subscribers => res.render('subscribers/subscribers', { subscribers: subscribers })).catch(err => res.status(400).json('Error: ' + err));

});

router.route('/add').get(Authenticate, (req, res) => {
    res.render('subscribers/newsubscriber');
});

router.route('/add').post(Authenticate, (req, res) => {
    const email = req.body.email;

    const newsubscriber = new Subscriber({ email });

    newsubscriber.save().then(() => res.redirect('/subscribers'))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/addfromfile').get(Authenticate, (req, res) => {
    res.render('subscribers/importsubscribers');
});

router.route('/addfromfile').post(Authenticate, (req, res) => {
    if (req.files)
        emailsFile = req.files.emails;
    else
        return res.status(400).json('No file uploaded');

    uploadPath = __basedir + '/uploads/' + emailsFile.name;
    emailsFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);
        else {
            workbook = xlsx.readFile(uploadPath);
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const subscribers = [];
            let subscriber = {};

            for (let cell in worksheet) {
                const cellAsString = cell.toString();

                if (cellAsString[0] === 'A') {
                    subscriber.email = worksheet[cell].v;
                    subscribers.push(subscriber);
                    subscriber = {};
                }
            }

            try {
                fs.unlinkSync(uploadPath);
            }
            catch (err) {
                res.status(400).json('Error: ' + err)
            };

            Subscriber.insertMany(subscribers).then(() => res.redirect('/subscribers')).catch(err => {
                if (err.code === 11000)
                    return res.redirect('/subscribers')
                else
                    res.status(400).json('Error: ' + err)
            });
        }
    });


});

router.route('/:id').get(Authenticate, (req, res) => {
    Subscriber.findById(req.params.id).then(subscriber => res.render('subscribers/subscriber', { subscriber: subscriber })).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/delete/:id').post(Authenticate, (req, res) => {
    Subscriber.findByIdAndDelete(req.params.id).then(subscriber => res.redirect("/subscribers")).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/edit/:id').get(Authenticate, (req, res) => {
    Subscriber.findById(req.params.id).then(
        subscriber => res.render('subscribers/editsubscriber', { subscriber: subscriber })).catch(err => res.status(400).json('Error: ' + err));
});

router.route('/edit/:id').post(Authenticate, (req, res) => {
    Subscriber.findById(req.params.id).then(
        subscriber => {
            subscriber.email = req.body.email;

            subscriber.save().then(
                (subscriber) => res.redirect(`/subscribers/${subscriber._id}`)).catch(err => res.status(400).json('Error: ' + err));
        }).catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;