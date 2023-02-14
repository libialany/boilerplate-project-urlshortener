require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// Basic Configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const dns = require('dns');
const URL = require('url').URL;
//============================================================
const connectDB = async () => {
  try {
    // await mongoose.connect(process.env['DB_URL'], {
    await mongoose.connect(process.env['DB_URL'], {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
  } catch (err) {
    console.error(err);
  }
}
connectDB();
//============================================================
const Schema = mongoose.Schema;

// User
const UrlsSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
})

let Urls = mongoose.model('Urls', UrlsSchema)
//============================================================
const isValidUrl = urlString => {
  var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}
app.get('/api/shorturl/:url', async (req, res) => {
  const { url } = req.params;
  if (!url) {
    return res.json({ error: 'invalid url' })
  }
  const findUrl = await Urls.findOne({ short_url: url }).select(['-_id', '-__v']).lean()
  if (!findUrl) {
    return res.json({ error: 'invalid url' })
  }
  res.redirect(findUrl.original_url)
});
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  try {
    if (!isValidUrl(url)) {
      return res.json({ error: 'invalid url' })
    }
    const urlObject = new URL(url);
    dns.lookup(urlObject.hostname, async (err, address, family) => {
      if (err) {
        res.json({
          original_url: url,
          short_url: "invalid URL"
        })
      } else {
        let newUrl = await Urls.create({ original_url: url, short_url: Math.floor(Math.random() * 100000).toString() });
        res.json(
          {
            original_url: url,
            short_url: newUrl.short_url
          }
        )
      }
    })
  } catch (error) {
    console.log(error);
    return res.json({ error: 'invalid url' })
  }
});
const PORT = 4000
mongoose.connection.once('open', () => {
  console.log('Connection to MongooseDB');
  app.listen(PORT || process.env.PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
})
