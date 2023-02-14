require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const autoIncrement = require('mongoose-auto-increment');
// Basic Configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));
const dns = require('dns');
const URL = require('url').URL;
//============================================================
var connection = mongoose.createConnection(process.env.DB_URL);
autoIncrement.initialize(connection);
const Schema = mongoose.Schema;
// Urls
const urlSchema = new Schema({
  original_url: { type: String, required: true }
})
urlSchema.plugin(autoIncrement.plugin, { model: 'Url', field: 'short_url' })
let Urls = connection.model('Url', urlSchema)
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
app.get('/api/shorturl/:url', async (req, res)=> {
  const { url } = req.params;
  if (!url) {
    return res.json({ error: 'invalid url' })
  }
  const findUrl = await Urls.findOne({ short_url: url }).select(['-_id', '-__v']).lean()
  if (!findUrl){
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
        let newUrl = await Urls.create({ original_url: url });
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
app.get('/a', async (req, res) => {
  const ans = await Urls.find().exec()
  console.log(ans);
  res.send({})
});

connection.once('open', () => {
  console.log('Connection to MongooseDB');
  app.listen(4000 || process.env.PORT, () => console.log(`Server running on port http://localhost:4000`));
})
