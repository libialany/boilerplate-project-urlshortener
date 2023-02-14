require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
// Basic Configuration
const port = process.env.PORT || 3000;

let i  = 0
let urls =[]

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
app.post('/api/shorturl',function(req, res) {
  const url= req.body.url;
  urls.push({ original_url : url, short_url : i})
  i=i+1
  res.json({ original_url : url, short_url : i});
});
app.get('/api/shorturl/:url?',function(req, res) {
  const ans = urls.find(url => url.short_url === url)
  if (ans) {res.json({ error: 'invalid url' })}
  res.redirect(ans.original_url)
});
// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
